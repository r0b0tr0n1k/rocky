### Part 1: Complete ER Diagram (Mermaid)

This diagram represents the exact entities and relationships shown in the diagram on Page 1 of the PDF. I have grouped them by logical sub-systems (Users/Organizations, Sessions, Modules/Rules, and Holdings) and used styling to mirror the color-coding (Orange, Green, Yellow, and Blue) from the original image.

```mermaid
erDiagram
    %% Organizations & Users (Orange, Blue)
    SM_ORGANIZATIONS ||--o{ SM_USERS : "employs"
    SM_ORGANIZATIONS ||--o{ SM_ORG_AREA : "covers"
    SM_ORGANIZATIONS ||--o{ SM_ORG_GROUPS : "assigned to"
    SM_GROUPS ||--o{ SM_GRP_PRIVS : "has privileges"
    SM_PRIVILEGES ||--o{ SM_GRP_PRIVS : "defined by"
    SM_SCHEMAS ||--o{ SM_GRP_PRIVS : "scoped to"

    %% Users & Holdings (Blue)
    SM_USERS ||--o{ SM_US_HOLDINGS : "manages access to"
    SM_USERS ||--o{ SM_US_PRIVS : "has personal privileges"
    SM_SCHEMAS ||--o{ SM_US_PRIVS : "scoped to"
    SM_PRIVILEGES ||--o{ SM_US_PRIVS : "assigned to user"

    %% Sessions (Green)
    SM_USERS ||--o{ SM_SESSIONS : "starts"
    SM_LANGUAGES ||--o{ SM_SESSIONS : "used in"
    SM_MODULES ||--o{ SM_SESSIONS : "accessed by"
    SM_SCHEMAS ||--o{ SM_SESSIONS : "context for"
    SM_SESSIONS ||--o{ SM_SESSIONS : "parent/child relationship" }

    %% Modules & Business Rules (Yellow)
    SM_MODULES ||--o{ SM_MODULE_PRIVS : "requires"
    SM_SCHEMAS ||--o{ SM_MODULE_PRIVS : "default schema"
    SM_MODULES ||--o{ SM_MODULE_BR : "contains"
    SM_BUSINESS_RULES ||--o{ SM_MODULE_BR : "linked to"
    SM_MODULES ||--o{ SM_MODULE_ELEMENTS : "renders"
    SM_LANGUAGES ||--o{ SM_MODULE_ELEMENTS : "translated to"
    SM_MODULES ||--o{ SM_MODULE_CSS : "styles"
    SM_MODULES ||--o{ SM_MODULE_HTML : "markup"
    SM_MODULES ||--o{ SM_MODULE_JS : "scripts"
    SM_MODULES ||--o{ SM_MODULE_TITLES : "displayed as"

    %% System Parameters & Codes (Yellow)
    SM_SCHEMAS ||--o{ SM_MODULES : "default schema"
    SM_LANGUAGES ||--o{ SM_MESSAGES : "translates"
    SM_LANGUAGES ||--o{ SM_LOG_CODES : "interprets"

    %% Entities Definition
    SM_ORGANIZATIONS {
        int ID_ORGANIZATION PK
        string NAME1
        string TYPE
    }
    SM_USERS {
        int ID_USER PK
        string NAME
        string USERNAME
        string PASSWORD
    }
    SM_SCHEMAS {
        int ID_SCHEMA PK
        string NAME
    }
    SM_SESSIONS {
        int ID_SESSION PK
        int ID_USER FK
        int ID_LANGUAGE FK
        int ID_MODULE FK
    }
    SM_MODULES {
        int ID_MODULE PK
        string NAME
        int ID_MODULE_SUP FK
        int DEFAULT_SCHEMA FK
    }
    SM_BUSINESS_RULES {
        int ID_BUSINESS_RULE PK
        string NAME
    }
    SM_LANGUAGES {
        int ID_LANGUAGE PK
        string NAME
    }

    %% Styling to match PDF colors
    style SM_ORGANIZATIONS fill:#f49643,stroke:#333
    style SM_USERS fill:#f49643,stroke:#333
    style SM_GROUPS fill:#f49643,stroke:#333
    style SM_PRIVILEGES fill:#f49643,stroke:#333
    style SM_SCHEMAS fill:#f49643,stroke:#333
    style SM_GRP_PRIVS fill:#f49643,stroke:#333
    style SM_US_PRIVS fill:#f49643,stroke:#333
    
    style SM_SESSIONS fill:#60d656,stroke:#333
    
    style SM_MODULES fill:#fff47d,stroke:#333
    style SM_MODULE_PRIVS fill:#fff47d,stroke:#333
    style SM_MODULE_BR fill:#fff47d,stroke:#333
    style SM_BUSINESS_RULES fill:#fff47d,stroke:#333
    style SM_MODULE_ELEMENTS fill:#fff47d,stroke:#333
    style SM_MODULE_CSS fill:#fff47d,stroke:#333
    style SM_MODULE_HTML fill:#fff47d,stroke:#333
    style SM_MODULE_JS fill:#fff47d,stroke:#333
    style SM_SYS_PARAMS fill:#fff47d,stroke:#333
    style SM_MESSAGES fill:#fff47d,stroke:#333
    style SM_LOG_CODES fill:#fff47d,stroke:#333
    style SM_LANGUAGES fill:#fff47d,stroke:#333
    style SM_MODULE_TITLES fill:#fff47d,stroke:#333
    
    style SM_US_HOLDINGS fill:#a6d3f6,stroke:#333
    style SM_ORG_AREA fill:#a6d3f6,stroke:#333
    style SM_ORG_GROUPS fill:#f49643,stroke:#333
```

---

### Part 2: Detailed Database Table Data (Textual Extraction)

Below is the comprehensive list of **24 tables** defined in the Oracle Designer report. I have extracted the `Column Name`, `Data Type`, `Primary Keys`, and `Foreign Keys` for each.

#### 1. `SM_BUSINESS_RULES` (Business Rules)

* **PK:** `ID_BUSINESS_RULE`
* **Columns:** `NAME` (varchar2 50), `DESCRIPTION` (varchar2 250), `D_INSERT` (date), `ID_INSERTER` (number), `ACTIVITY` (varchar2 1, default 1), `VALID_TO` (date), `ID_SESSION` (FK).
* **FK:** `ID_SESSION` → `SM_SESSIONS.ID_SESSION`.

#### 2. `SM_GROUPS` (User Roles/Groups)

* **PK:** `ID_GROUP`
* **Columns:** `NAME` (varchar2 30), `D_INSERT`, `ID_INSERTER`, `ACTIVITY`, `VALID_TO`, `ID_SESSION` (FK).
* **FK:** `ID_SESSION` → `SM_SESSIONS.ID_SESSION`.

#### 3. `SM_GRP_PRIVS` (Privileges inside Groups)

* **PK:** `ID_GRP_PRIV`
* **Unique Key:** `SGV_UK` (ID_SCHEMA, ID_PRIVILEGE, ID_GROUP)
* **Columns:** `ID_GROUP` (FK), `ID_PRIVILEGE` (FK), `ID_SCHEMA` (FK), `D_INSERT`, `ID_INSERTER`, `ACTIVITY`, `VALID_TO`, `ID_SESSION` (FK).
* **FKs:** `ID_GROUP` → `SM_GROUPS.ID_GROUP`, `ID_PRIVILEGE` → `SM_PRIVILEGES.ID_PRIVILEGE`, `ID_SCHEMA` → `SM_SCHEMAS.ID_SCHEMA`, `ID_SESSION` → `SM_SESSIONS.ID_SESSION`.

#### 4. `SM_LANGUAGES` (Language Codes)

* **PK:** `ID_LANGUAGE`
* **Columns:** `NAME` (varchar2 30), `D_INSERT`, `ID_INSERTER`, `ACTIVITY`, `VALID_TO`, `ID_SESSION` (FK).
* **FK:** `ID_SESSION` → `SM_SESSIONS.ID_SESSION`.

#### 5. `SM_LOG_CODES` (Logical Codes for the System)

* **PK:** `ID_LOG_CODE`
* **Unique Key:** `PLE_UK` (`NAME`, `CODE`)
* **Columns:** `NAME` (varchar2 30), `CODE` (varchar2 20), `ID_LANGUAGE` (FK), `D_INSERT`, `TEXT` (varchar2 50), `DISP_CODE` (varchar2 20), `ID_INSERTER`, `ACTIVITY`, `VALID_TO`, `ID_SESSION` (FK).
* **FKs:** `ID_LANGUAGE` → `SM_LANGUAGES.ID_LANGUAGE`, `ID_SESSION` → `SM_SESSIONS.ID_SESSION`.

#### 6. `SM_MESSAGES` (Message Code Table)

* **PK:** `ID_MESSAGE`
* **Unique Key:** `SMSG_UK` (`ID_LANGUAGE`, `NAME`)
* **Columns:** `NAME` (varchar2 30), `TEXT` (varchar2 500), `ID_LANGUAGE` (FK), `TYPE` (varchar2 10), `D_INSERT`, `ID_INSERTER`, `ACTIVITY`, `VALID_TO`, `ID_SESSION` (FK).
* **FKs:** `ID_LANGUAGE` → `SM_LANGUAGES.ID_LANGUAGE`, `ID_SESSION` → `SM_SESSIONS.ID_SESSION`.

#### 7. `SM_MODULES` (Module Code Table)

* **PK:** `ID_MODULE`
* **Columns:** `NAME` (varchar2 30), `TITLE` (varchar2 30), `TYPE` (varchar2 10), `ORDER_SEQ` (number), `ID_MODULE_SUP` (FK - self-reference), `D_INSERT`, `ID_INSERTER`, `ACTIVITY`, `VALID_TO`, `ID_SESSION` (FK), `DEFAULT_SCHEMA` (FK).
* **FKs:** `ID_MODULE_SUP` → `SM_MODULES.ID_MODULE`, `DEFAULT_SCHEMA` → `SM_SCHEMAS.ID_SCHEMA`, `ID_SESSION` → `SM_SESSIONS.ID_SESSION`.

#### 8. `SM_MODULE_BR` (Module - Business Rule Bridge)

* **PK:** `ID_MODULE_BR`
* **Unique Key:** `SMR_UK` (`ID_BUSINESS_RULE`, `ID_MODULE`)
* **Columns:** `EXECUTE_IF` (varchar2 250), `ID_MODULE` (FK), `ID_BUSINESS_RULE` (FK), `D_INSERT`, `ID_INSERTER`, `ACTIVITY`, `VALID_TO`, `ID_SESSION` (FK).
* **FKs:** `ID_BUSINESS_RULE` → `SM_BUSINESS_RULES.ID_BUSINESS_RULE`, `ID_MODULE` → `SM_MODULES.ID_MODULE`, `ID_SESSION` → `SM_SESSIONS.ID_SESSION`.

#### 9. `SM_MODULE_CSS` (Module CSS Styles)

* **PK:** `ID_MODULE_CSS`
* **Columns:** `ID_MODULE` (FK), `TEXT` (varchar2 1000), `D_INSERT`, `ID_INSERTER`, `ACTIVITY`, `VALID_TO`, `ID_SESSION` (FK).
* **FKs:** `ID_MODULE` → `SM_MODULES.ID_MODULE`, `ID_SESSION` → `SM_SESSIONS.ID_SESSION`.

#### 10. `SM_MODULE_ELEMENTS` (UI Elements of Modules)

* **PK:** `ID_MODULE_ELEMENT`
* **Unique Key:** `SMT_UK` (Implied Unique combination of fields)
* **Columns:** `NAME` (varchar2 30), `ID_MODULE` (FK), `ID_LANGUAGE` (FK), `PROMPT_TEXT` (varchar2 100), `HINT_TEXT` (varchar2 100), `VALUE_TEXT` (varchar2 400), `ID_SESSION` (FK).
* **FKs:** `ID_LANGUAGE` → `SM_LANGUAGES.ID_LANGUAGE`, `ID_MODULE` → `SM_MODULES.ID_MODULE`, `ID_SESSION` → `SM_SESSIONS.ID_SESSION`.

#### 11. `SM_MODULE_HTML` (Module HTML Markup)

* **PK:** `ID_MODULE_HTML`
* **Columns:** `ID_MODULE` (FK), `TEXT` (CLOB), `D_INSERT`, `ID_INSERTER`, `ACTIVITY`, `VALID_TO`, `ID_SESSION` (FK).
* **FKs:** `ID_MODULE` → `SM_MODULES.ID_MODULE`, `ID_SESSION` → `SM_SESSIONS.ID_SESSION`.

#### 12. `SM_MODULE_JS` (Module Javascript)

* **PK:** `ID_MODULE_JS`
* **Columns:** `NAME` (varchar2 30), `TYPE` (varchar2 10), `ORDER_SEQ` (number), `ID_MODULE` (FK), `TEXT` (varchar2 4000), `D_INSERT`, `ID_INSERTER`, `ACTIVITY`, `VALID_TO`, `ID_SESSION` (FK).
* **FKs:** `ID_MODULE` → `SM_MODULES.ID_MODULE`, `ID_SESSION` → `SM_SESSIONS.ID_SESSION`.

#### 13. `SM_MODULE_PRIVS` (Privileges Required by Module)

* **PK:** `ID_MODULE_PRIV`
* **Unique Key:** `SMV_UK` (`ID_SCHEMA`, `ID_PRIVILEGE`, `ID_MODULE`)
* **Columns:** `ID_MODULE` (FK), `ID_PRIVILEGE` (FK), `ID_SCHEMA` (FK), `D_INSERT`, `ID_INSERTER`, `ACTIVITY`, `VALID_TO`, `ID_SESSION` (FK).
* **FKs:** `ID_MODULE` → `SM_MODULES.ID_MODULE`, `ID_PRIVILEGE` → `SM_PRIVILEGES.ID_PRIVILEGE`, `ID_SCHEMA` → `SM_SCHEMAS.ID_SCHEMA`, `ID_SESSION` → `SM_SESSIONS.ID_SESSION`.

#### 14. `SM_MODULE_TITLES` (Multilingual Module Titles)

* **PK:** `ID_MODULE_TITLE`
* **Unique Key:** `SMTIT_UK` (`ID_LANGUAGE`, `ID_MODULE`, `NAME`)
* **Columns:** `NAME` (varchar2 30), `ID_LANGUAGE` (FK), `ID_MODULE` (FK), `D_INSERT`, `ID_INSERTER`, `ACTIVITY`, `VALID_TO`, `ID_SESSION` (FK).
* **FKs:** `ID_LANGUAGE` → `SM_LANGUAGES.ID_LANGUAGE`, `ID_MODULE` → `SM_MODULES.ID_MODULE`, `ID_SESSION` → `SM_SESSIONS.ID_SESSION`.

#### 15. `SM_ORGANIZATIONS` (Organization Code Table)

* **PK:** `ID_ORGANIZATION`
* **Columns:** `NAME1` (varchar2 60), `NAME2` (varchar2 50), `NAME3` (varchar2 50), `ADDRESS1` (varchar2 50), `ADDRESS2` (varchar2 50), `ADDRESS3` (varchar2 50), `TEL` (varchar2 15), `FAX` (varchar2 15), `ID_ORG_SUPERIOR` (number), `D_INSERT`, `ID_INSERTER`, `TYPE`, `ACTIVITY`, `VALID_TO`, `ID_SESSION` (FK).
* **FK:** `ID_SESSION` → `SM_SESSIONS.ID_SESSION`.

#### 16. `SM_ORG_AREA` (Organizational Competence Areas)

* **PK:** Composite Key (`ID_ORGANIZATION`, `ID_COMMUNE`)
* **Columns:** `ID_ORGANIZATION` (FK), `ID_COMMUNE` (FK), `D_INSERT`, `ID_INSERTER`, `ACTIVITY`, `VALID_TO`, `ID_SESSION` (FK).
* **FKs:** `ID_ORGANIZATION` → `SM_ORGANIZATIONS.ID_ORGANIZATION`, `ID_COMMUNE` → `HK_COMMUNES.ID_COMMUNE`, `ID_SESSION` → `SM_SESSIONS.ID_SESSION`.

#### 17. `SM_ORG_GROUPS` (Groups Assigned to Organizations)

* **PK:** `ID_ORG_GROUP`
* **Unique Key:** `SOP_UK`
* **Columns:** `ID_ORGANIZATION` (FK), `ID_GROUP` (FK), `ID_SCHEMA` (FK), `D_INSERT`, `ID_INSERTER`, `ACTIVITY`, `VALID_TO`, `ID_SESSION` (FK).
* **FKs:** `ID_GROUP` → `SM_GROUPS.ID_GROUP`, `ID_ORGANIZATION` → `SM_ORGANIZATIONS.ID_ORGANIZATION`, `ID_SCHEMA` → `SM_SCHEMAS.ID_SCHEMA`, `ID_SESSION` → `SM_SESSIONS.ID_SESSION`.

#### 18. `SM_PRIVILEGES` (Privileges Code Table)

* **PK:** `ID_PRIVILEGE`
* **Columns:** `NAME` (varchar2 30), `GEO_LIMITED` (varchar2 1), `TYPE` (varchar2 10), `ID_PRIVILEGE_SUP` (FK - self-reference), `D_INSERT`, `ID_INSERTER`, `ACTIVITY`, `VALID_TO`, `ID_SESSION` (FK).
* **FKs:** `ID_PRIVILEGE_SUP` → `SM_PRIVILEGES.ID_PRIVILEGE`, `ID_SESSION` → `SM_SESSIONS.ID_SESSION`.

#### 19. `SM_SCHEMAS` (Database Schemas like Bovine, Ovine, etc.)

* **PK:** `ID_SCHEMA`
* **Columns:** `NAME` (varchar2 30), `D_INSERT`, `ID_INSERTER`, `ACTIVITY`, `VALID_TO`, `ID_SESSION` (FK).
* **FK:** `ID_SESSION` → `SM_SESSIONS.ID_SESSION`.

#### 20. `SM_SESSIONS` (User Interaction Traceability)

* **PK:** `ID_SESSION`
* **Columns:** `ID_SESSION_SUP` (FK - self-reference), `ID_USER` (FK), `ID_LANGUAGE` (FK), `ID_MODULE` (FK), `D_INSERT`, `ACTIVITY`, `VALID_TO`, `ID_SCHEMA` (FK).
* **FKs:** `ID_LANGUAGE` → `SM_LANGUAGES.ID_LANGUAGE`, `ID_MODULE` → `SM_MODULES.ID_MODULE`, `ID_SCHEMA` → `SM_SCHEMAS.ID_SCHEMA`, `ID_SESSION_SUP` → `SM_SESSIONS.ID_SESSION`, `ID_USER` → `SM_USERS.ID_USER`.

#### 21. `SM_SYS_PARAMS` (System Parameters)

* **PK:** `ID_SYS_PARAM`
* **Columns:** `CODE` (varchar2 30), `VALUE` (varchar2 50), `D_INSERT`, `ID_INSERTER`, `ACTIVITY`, `VALID_TO`, `ID_SESSION` (FK).
* **FK:** `ID_SESSION` → `SM_SESSIONS.ID_SESSION`.

#### 22. `SM_USERS` (System Users)

* **PK:** `ID_USER`
* **Unique Key:** `SUR_UK` (`USERNAME`)
* **Columns:** `NAME` (varchar2 50), `ID_ORGANIZATION` (FK), `D_INSERT`, `ID_INSERTER`, `USERNAME` (varchar2 30), `PASSWORD` (varchar2 50), `GEO_UNLIMITED` (varchar2 10), `ACTIVITY`, `ID_LANGUAGE` (FK), `VALID_TO`, `ID_SESSION` (FK), `ID_MARKER` (number).
* **FKs:** `ID_LANGUAGE` → `SM_LANGUAGES.ID_LANGUAGE`, `ID_ORGANIZATION` → `SM_ORGANIZATIONS.ID_ORGANIZATION`, `ID_SESSION` → `SM_SESSIONS.ID_SESSION`.

#### 23. `SM_US_HOLDINGS` (User Access to Farms/KMG_MID)

* **PK:** `ID_US_HOLDING`
* **Unique Key:** `SUG_UK`
* **Columns:** `ID_USER` (FK), `KMG_MID` (number), `TYPE` (varchar2 10 - defines Read, Write, Read-Write), `D_INSERT`, `ID_INSERTER`, `ACTIVITY`, `VALID_TO`, `ID_SESSION` (FK).
* **FKs:** `ID_SESSION` → `SM_SESSIONS.ID_SESSION`, `ID_USER` → `SM_USERS.ID_USER`.

#### 24. `SM_US_PRIVS` (Individual User Privileges per Schema)

* **PK:** `ID_US_PRIV`
* **Unique Key:** `SUV_UK` (`ID_SCHEMA`, `ID_PRIVILEGE`, `ID_USER`)
* **Columns:** `ID_USER` (FK), `ID_PRIVILEGE` (FK), `ID_SCHEMA` (FK), `D_INSERT`, `ID_INSERTER`, `ACTIVITY`, `VALID_TO`, `ID_SESSION` (FK), `DEFAULT_PRIV` (varchar2 1, default 1).
* **FKs:** `ID_PRIVILEGE` → `SM_PRIVILEGES.ID_PRIVILEGE`, `ID_SCHEMA` → `SM_SCHEMAS.ID_SCHEMA`, `ID_SESSION` → `SM_SESSIONS.ID_SESSION`, `ID_USER` → `SM_USERS.ID_USER`.

---

### Part 3: Structural Business/Data Rules (Derived from Schema)

While this document does not contain logical business logic (like "120-day gap between orders" found in the previous eartags file), it explicitly defines structural rules for data integrity and system management:

1. **Audit Trail Enforcement:** Every single table enforces a standard auditing pattern. The columns `D_INSERT` (Date inserted), `ID_INSERTER` (User who inserted), and `ACTIVITY` (Default value `1`, indicating active) are mandatory (`NOT NULL`). Records are never physically deleted; they are logically deactivated by setting `VALID_TO` to a date or `ACTIVITY` to `0`.
2. **Hierarchical Organizations & Roles:**
    * Organizations (`SM_ORGANIZATIONS`) can have a superior organization (`ID_ORG_SUPERIOR`), allowing for hierarchical reporting structures.
    * Privileges can be hierarchical (`ID_PRIVILEGE_SUP`), allowing child privileges to inherit attributes from parent privileges.
3. **Multilingual Support:** The system is designed to support multiple languages from the ground up. Tables for `SM_LANGUAGES`, `SM_MESSAGES`, `SM_LOG_CODES`, `SM_MODULE_ELEMENTS`, and `SM_MODULE_TITLES` all rely on `ID_LANGUAGE` as a foreign key.
4. **Geographic/Competence Limiting:**
    * `SM_USERS` has a `GEO_UNLIMITED` flag to indicate if a user is restricted to specific areas.
    * `SM_ORG_AREA` links an organization to specific communes (`HK_COMMUNES`), enforcing that an organization is only "competent" for those specific regions.
    * `SM_US_HOLDINGS` provides fine-grained access control, granting users specific access rights (TYPE) to individual farms (`KMG_MID`).
5. **Session Traceability:** `SM_SESSIONS` creates a traceable record every time a user logs in or switches modules. It records the `ID_USER`, `ID_MODULE`, and `ID_LANGUAGE`, and even links child/parent sessions (`ID_SESSION_SUP`) for complex navigation tracing. Every table links back to the `ID_SESSION` that created or modified it.
6. **User & Group Privileges:** The system supports a comprehensive RBAC (Role-Based Access Control) model:
    * **Role assignment:** Groups (`SM_GROUPS`) are assigned privileges (`SM_GRP_PRIVS`) scoped to specific schemas (`SM_SCHEMAS`).
    * **User assignment:** Users (`SM_USERS`) can inherit privileges through organizations (`SM_ORG_GROUPS`), plus they can receive direct, personalized privileges (`SM_US_PRIVS`).
    * **Module-level validation:** A user cannot access a specific module (`SM_MODULES`) unless they possess the required privileges defined in `SM_MODULE_PRIVS`.
