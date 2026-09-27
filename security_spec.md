# Nomadic Lex Security Specification & Dirty Dozen Audit

## 1. Data Invariants

1. **User Profile Invariant**:
   A user document (`/users/{userId}`) can only be read or written by the authenticated owner where `request.auth.uid == userId`.
   The `uid` in the document body must strictly match `request.auth.uid`.
   No user can read or overwrite another student's profile or PII.

2. **Subcollection Master Gate Invariant**:
   Subcollections (`courses`, `activities`, `briefs`) under `/users/{userId}` can only be accessed by the authenticated user whose `request.auth.uid == userId`.
   Every document created in a subcollection must have `incoming().userId == request.auth.uid`.

3. **Field Immutability Invariant**:
   The `createdAt` field and `userId` / `uid` cannot be altered after creation.
   `updatedAt` must be present on updates.

4. **Volumetric Boundary Invariant**:
   All string fields have explicit length constraints matching `firebase-blueprint.json` (e.g., `displayName` <= 120 chars, `caseTitle` <= 256 chars, `facts` <= 5000 chars, `progress` between 0 and 100).

---

## 2. The "Dirty Dozen" Payloads

1. **Unauthenticated Read of User Profile**
   - Operation: `GET /users/user_victim`
   - Auth: Unauthenticated (`auth == null`)
   - Expected: `PERMISSION_DENIED`

2. **Cross-User Profile Hijack (Read)**
   - Operation: `GET /users/user_victim`
   - Auth: `auth.uid == "user_attacker"`
   - Expected: `PERMISSION_DENIED`

3. **Cross-User Profile Overwrite (Create)**
   - Operation: `CREATE /users/user_victim`
   - Auth: `auth.uid == "user_attacker"`
   - Payload: `{"uid": "user_victim", "email": "victim@lawschool.edu", "displayName": "Victim", "academicStage": "1L", "studyStreak": 0, "createdAt": "...", "updatedAt": "..."}`
   - Expected: `PERMISSION_DENIED`

4. **UID Spoofing in Body**
   - Operation: `CREATE /users/user_attacker`
   - Auth: `auth.uid == "user_attacker"`
   - Payload: `{"uid": "user_victim", "email": "attacker@nomadic.com", "displayName": "Attacker", "academicStage": "1L", "studyStreak": 0, "createdAt": "...", "updatedAt": "..."}`
   - Expected: `PERMISSION_DENIED` (Body `uid` != `request.auth.uid`)

5. **Junk / Poisoned Document ID (> 128 chars or illegal characters)**
   - Operation: `CREATE /users/<1500_char_string>`
   - Auth: `auth.uid == "<1500_char_string>"`
   - Expected: `PERMISSION_DENIED` (fails `isValidId`)

6. **Missing Required Fields on User Profile**
   - Operation: `CREATE /users/user_123`
   - Auth: `auth.uid == "user_123"`
   - Payload: `{"uid": "user_123"}` (missing email, displayName, createdAt, updatedAt)
   - Expected: `PERMISSION_DENIED`

7. **Negative or Excess Progress Infiltration**
   - Operation: `CREATE /users/user_123/courses/CIV-101`
   - Auth: `auth.uid == "user_123"`
   - Payload: `{"userId": "user_123", "courseId": "CIV-101", "progress": 9999, "completedLessons": 999, "totalLessons": 8, "nextTopic": "Torts", "updatedAt": "..."}`
   - Expected: `PERMISSION_DENIED` (progress > 100)

8. **Subcollection Cross-User Write Attempt**
   - Operation: `CREATE /users/user_victim/courses/CIV-101`
   - Auth: `auth.uid == "user_attacker"`
   - Payload: `{"userId": "user_attacker", "courseId": "CIV-101", "progress": 0, "completedLessons": 0, "totalLessons": 8, "nextTopic": "Marriage", "updatedAt": "..."}`
   - Expected: `PERMISSION_DENIED` (path userId != auth.uid)

9. **Oversized Buffer Injection in Case Brief**
   - Operation: `CREATE /users/user_123/briefs/brief_1`
   - Auth: `auth.uid == "user_123"`
   - Payload: `{"userId": "user_123", "caseTitle": "Title", "facts": "<100KB string>", "createdAt": "...", "updatedAt": "..."}`
   - Expected: `PERMISSION_DENIED` (facts > 5000 chars)

10. **Shadow Field Injection on Update**
    - Operation: `UPDATE /users/user_123`
    - Auth: `auth.uid == "user_123"`
    - Payload diff includes: `{"isAdmin": true, "superUser": true}`
    - Expected: `PERMISSION_DENIED` (keys not allowed in schema)

11. **Modifying Immutable Field `createdAt`**
    - Operation: `UPDATE /users/user_123`
    - Auth: `auth.uid == "user_123"`
    - Payload diff modifies: `{"createdAt": "2020-01-01T00:00:00Z"}`
    - Expected: `PERMISSION_DENIED`

12. **Blanket Query / Collection Group Scraping by Non-Owner**
    - Operation: `LIST /users/user_victim/briefs`
    - Auth: `auth.uid == "user_attacker"`
    - Expected: `PERMISSION_DENIED`
