---
name: iso-9241-12
description: Ergonomic requirements for presentation of information on visual display terminals. Use when designing visual interfaces, organizing screen information, or creating display layouts. Triggers: presentation of information, visual display, screen layout, windows, lists, tables, fields, graphical objects, coding techniques, colour coding, ISO 9241-12.
---

# ISO 9241-12:1998 - Presentation of Information!

Follow ISO 9241-12:1998 for ergonomic design of visual presentation of information on VDTs.

## Scope!

Applies ONLY to visual display terminals (paper-based forms excluded). Does NOT cover auditory presentation.

**Intended for**:
- User interface designers (during development)`
- Buyers (during procurement)`
- Those ensuring products meet recommendations`

**Serves**:`
- Guidance for designers during design`
- Basis for heuristic evaluation`
- Guidance for usability testing`

## Characteristics of Presented Information (Clause 4)!

**Key characteristics**:`
- **Clarity**: Information conveyed quickly & accurately`
- **Discriminability**: Displayed information can be distinguished accurately`
- **Conciseness**: Users given only necessary information`
- **Consistency**: Same information presented same way throughout application`
- **Detectability**: User's attention directed towards required information`
- **Legibility**: Information easy to read`
- **Comprehensibility**: Meaning clear, unambiguous, recognizable`

## Organization of Information!

### 5.1 Location of Information`
Information should be located to meet user expectations & task requirements. Minimizes search time.

### 5.2 Appropriateness of Windows`
Use windows when:`
- Monitor/access multiple systems/applications/processes simultaneously`
- Evaluate/compare/manipulate multiple information sources`
- Alternate frequently between tasks/systems/applications`
- Preserve broader task context while performing subtasks`
- Need access to supplementary dialogue components near current focus`

**System capabilities**:`
- Screen size/resolution: meaningful amounts of information without numerous operations`
- System response: graphics don't slow display rates noticeably`

### 5.3 Recommendations for Windows`

**Unique window identification**: Each window should have unique ID (system name, application, function, file name). Include indication of current location/task.`

**Default window parameters**: Default sizes/locations minimize operations to complete task.`

**Consistent window appearance**: Within application, same type windows = consistent appearance.`

**Consistent appearance in multi-app environment**: Within multi-application, same type windows = consistent appearance if used together.`

**Primary/secondary window relationships**: Relationship always visually apparent.`

**Identification of window control elements**: Controls with different functions (close, resize) visually discriminable, consistently placed.`

**Overlapping window format**: Use when:`
- Task requires variable/unconstrained types/sizes/contents/arrangements`
- Visual display small/low resolution (can't view meaningful amounts in tiled windows)`

**Tiled window format**: Use when:`
- Task requires little/no variation in size/number/contents/arrangement`
- Continuous visual access to critical/necessary information required`
- Processing rapid manipulation/display of overlapping windows degrades system response/user performance`

**Selection of window format**: Users should be allowed to select preferred format & save as "default".`

### 5.4 Areas!

**Consistent location of areas**: Identification, input/output, control, message areas consistently located within application.`

**Density of displayed information**: Not perceived as overly cluttered. Limit ~40% (percentage of character positions populated). Other graphical elements (lines, buttons, icons) increase density.`

### 5.5 Input/Output Area!

**Required information**: All required information for task displayed if possible. If not:`
1. Structure into subsets corresponding to task steps`
2. Support appropriate subtasks, meaningful to intended users`
3. Splitting should NOT reduce task performance`

**Scrolling and paging**: If information exceeds area, provide easy means (horizontal/vertical paging/scrolling). When discerning relationship between sets, display both sets on single screen if possible (use windows, split-screens, keywords, indexing).`

**Indication of relative position**: If information exceeds area, indicate relative position/proportion (scroll bar, slider, "page x of y").`

### 5.6 Groups!

**Distinction of groups**: Groups perceptually distinct via spacing/location. Use boxes, gestalt principles (proximity, similarity, closure).`

**Sequencing**: If task requires specific sequence, group & place in order supporting that sequence.`

**Use of conventions**: Groups arranged to follow common formats/conventions (e.g., addresses).`

**Functional grouping**: If no specific sequence required, group by semantically related information (meaningful to user).`

**Visually distinct groups - "chunks"**: If rapid visual search required:`
- Minimize number of groups`
- Each group spans ~5-6 lines vertical, 10-12 characters horizontal`
- Character size NOT decreased to get more info (impairs readability)`

### 5.7 Lists!

**List structure**: Organized in logical/natural order appropriate to task. If no order: consider alphabetic ordering.`

**Item separation**: Items/groups visually distinct to support visual scanning.`

**Alphabetic information**: Left-justified for left-to-right languages. Indentation indicates subordination in hierarchical lists.`

**Numeric information**: Without decimal signs → right-justified. With decimal signs → aligned wrt decimal.`

**Fixed font size**: Fixed font with constant spacing for numeric lists.`

**Item numbering**: Numbered lists begin with "1" (one), not "O" (zero), unless conflicts with user expectations. In menus, numbering for option selection/execution doesn't apply.`

**Continuity of item numbering**: If list exceeds area & paged/scrolled, items numbered continuously wrt first item in initial area.`

**Indication of list continuation**: If list extends beyond area, provide indication ("more", "page 2 of 3", scroll bar).`

### 5.8 Tables!

**List organization in tables**: Tabular info arranged so most relevant/highest priority material in leftmost column, associated but less significant material in columns further right (for left-to-right languages).`

**Consistency with paper forms**: If used in task, display format matches paper forms. For data entry tasks see ISO 9241-17.`

**Maintaining column and row headings**: If table has headings & extends beyond area, associated headings with visible columns/rows always visible.`

**Facilitating visual scanning**: Provide distinctive feature to aid scanning (blank lines every ~5 lines, colours, lines). Techniques to aid scanning or indicate table areas.`

**Column spacing**: Columns perceptually distinct. Techniques: ~3-5 spaces on left, lines between columns, colours, etc.`

### 5.9 Labels!

**Labelling screen elements**: Screen elements (fields, items, icons, graphs) should be labelled unless meaning obvious & clearly understood by intended users. If labelling not practicable (space limitation), system-initiated object identification (tool tip, quick info, balloon help) acceptable alternative.`

**Label designation**: Labels should explain purpose & content of designated information item.`

**Grammatical construction**: Labels should be grammatically consistent (e.g., consistent use of non-verb combinations).`

**Label position**: Labels consistently located adjacent to designated information item.`

**Distiction of labels and associated information**: Labels distinguishable from information they designate (spaces, formatting, shape, colour).`

**Label format and alignment**: Labels & fields consistently formatted (font, size, shape) & aligned (left/right-justified).`

**Labels for units of measurement**: Units included in label or to right of read-only/entry field, unless obvious to intended user.`

### 5.10 Fields!

**Distiction of different field types**: Entry & read-only fields visually distinct (label, format, shape, colour). User-entered data distinguishable from system-generated data in entry fields (e.g., defaults).`

**Partitioning long information items**: Long items partitioned into groups with specified number of characters used consistently for entry/display.`

**Entry field format**: If specific format required, clearly indicated (prompt, field help), unless obvious. Most relevant for users NOT familiar with format.`

**Entry field length**: Non-scrolling fixed length entry field - clearly indicated (e.g., using "____" or "--------").`

## Graphical Objects (Clause 6)!

### 6.1 General Recommendations!

**Distinctive states of graphical objects**: Coding techniques indicate different states (image polarity reversal, blinking, underscoring, colour, contrast enhancement, graphics, size).`

**Differentiating objects of identical type**: If identical graphical representations (icons) for different objects, each gets unique identity via text label.`

### 6.2 Cursors and Pointers!

**Designation of cursor and pointer position**: Cursors/pointers indicate position with distinctive visual features (shape, blink, colour, brightness).`

**Cursor occlusion of characters**: Cursors should NOT obscure any character displayed at cursor position.`

**Cursor and pointer location**: Cursors/pointers remain stationary until position change initiated by user. System may auto-position cursor to anticipate next task step.`

**Cursor "home" position**: If predefined home position exists, consistent within active input/output areas.`

**Initial position for entry fields**: When fields first displayed, cursor automatically positioned in most appropriate entry field for user's current task & expectations. Top left-hand field = common default if no other more appropriate.`

**Point designation accuracy**: If positioning accuracy required (graphic interactions), displayed pointer includes point designation feature (cross-hair, V-shaped symbol).`

**Different cursors/pointers**: If same displayed information used by multiple users/operators simultaneously, visually distinct cursor/pointer for each individual.`

**Multiple cursors and pointers**: If multiple cursors displayed, active cursor/pointer visually distinct from those NOT currently active.`

## Coding Techniques (Clause 7)!

### 7.1 General Recommendations for Codes!

**Distinctiveness of codes**: Codes perceptually distinct from each other. Reduce redundant elements identical across items (A13404 → A-04, A13402 → A-02).`

**Consistent coding**: Codes used consistently with same meaning/same function. Across applications, consistent meaning/function beneficial to task performance.`

**Meaningfulness**: Built into codes whenever possible. Mnemonic codes (meaningful, associated with words) easier to learn/recall. Preference to mnemonic over arbitrary codes. Clear associations between coded information & intended meaning.`

**Access to meaning of code**: When code meaning NOT obvious to user, information about meaning easily accessible.`

**Use of standards or conventional meaning**: Codes assigned according to established standards/conventional meanings for intended user group (e.g., postal code).`

**Rules of code construction**: Rules established for specification of codes. Applied consistently & unambiguously.`

**Removal of codes**: If absence of information important to user's task, code indicates absence rather than removing code. (Network connection no longer available → icon shown crossed out, NOT removed).`

### 7.2 Alphanumeric Coding!

**Length of character strings**: Codes short, preferably ≤6 characters (while providing meaningfulness, unique codes, ability to add codes). Trade-offs: fewest characters vs. meaningfulness vs. uniqueness.`

**Alphabetic vs. numeric codes**: Alphabetic generally preferred over numeric, unless numeric offers greater meaningfulness for particular task.`

**Use of upper case**: If alphabetic coding for input, upper-case & lower-case letters have same meaning, unless contrary to user expectations.`

### 7.3 Abbreviations for Alphanumeric Codes!

**Length of abbreviations**: As short as possible. Depends on number & similarity of words to be abbreviated.`

**Abbreviations of different length**: If in set of abbreviations of equal length, some can be shortened without ambiguity, permitted to minimize required keystrokes.`

**Truncation**: Truncation to construct codes considered when can be done without ambiguity (take first 3 letters for commands).`

**Deviation from rules of code construction**: If abbreviation deviates from rule, extent of deviation minimized. If >10% of abbreviations are deviations, rule should be changed.`

**Conventional and task-related abbreviations**: Conventional & task-related abbreviations used when required to meet user expectations.`

### 7.4 Graphical Coding!

**Levels of graphical codes**: Number of levels/degrees of coding limited. No more than 3 size codes, for example.`

**Construction of icons**: Icons constructed to be easily discerned & discriminated. Easily & clearly comprehended.`

**Three-dimensional coding**: Use of techniques to create perception of three dimensions helps users discriminate between different information categories.`

**Geometric shapes**: Coding with geometric shapes helps discriminate between different information categories. Unique & discriminable geometric shape for each category. Minimize overall number of categories & shapes displayed.`

**Line coding**: If coding by different line appearances (solid, dashed, dotted) & line width (boldness), variations clearly discriminable. Useful for maps/graphs. ~8 combinations of line types & widths.`

**Line orientation**: If line orientation used for coding direction/value, contextual information provided so direction/values accurately identifiable.`

### 7.5 Colour Coding!

**Colour as auxiliary coding**: Colour should NEVER be ONLY means of coding (some people discriminate poorly/cannot discriminate based on colour). Good auxiliary code, made redundant with other techniques.`

**Indication of meaning**: Discriminate use of colours avoided (makes displays appear "busy"/cluttered, reduces effectiveness of colour coding).`

**Attachment to categories of information**: If colour is dominant code, each colour represents ONLY one category of information. If same colour for different categories, user recognition of intended meaning may be impaired.`

**Colour-coding conventions**: Familiar conventions followed, taking context into account (red = warning; yellow = caution; green = OK/available). Consistent with task conventions & cultural expectations.`

**Number of colours used**: If colour coding used, colours readily distinguishable by user. Preferable to use NO more than 6 colours in addition to black & white. (Does NOT refer to colours within images/graphical representations).`

**Satrated blue**: Saturated blue avoided for display of text/symbols on dark background (small, saturated blue elements often difficult to reliably discriminate & bring into clear focus).`

**Selection of colours for non-colour units**: If information presented on both colour VDTs & monochrome VDTs, colours chosen to be displayed as discriminable grey levels on monochrome VDT.`

**Chromostereopsis**: Highly saturated colours of spectrally extreme wavelengths (like red & blue) produce unintended depth effects or excessive accommodation. NOT used adjacent for reading tasks.`

### 7.6 Markers!

**Special symbols for markers**: Markers (e.g., *, →) considered for drawing attention to selected alphanumeric items. Used for permanent selection.`

**Markers for selection**: Different markers used to indicate single selection vs. multiple selection.`

**Unique use of symbols for markers**: Markers used consistently. NOT used for any other purpose or displayed under conditions where confusion with other markers might occur.`

**Positioning of markers**: Markers positioned close to items marked. Markers NOT appear to be part of displayed items. Designed & positioned so users can identify them clearly.`

## Sample Procedure for Assessing Applicability & Adherence (Annex A)!

### A.1 General!
Two-stage process:`
1. Determine which recommendations are relevant (applicability)`
2. Determine whether relevant recommendations adhered to (adherence)`

**Evaluation depends on**:`
- Analysis of typical users, their typical/critical tasks, typical usage environments`
- Interface design depends on task, user, environment, available technology`
- Cannot be applied without knowledge of design & context of use`
- NOT intended as prescriptive set of rules applied in entirety`
- Assumes designer has proper information about task/user requirements & understands available technology`

### A.2 Applicability!

**Based on two factors**:`
a) **Conditional statement** (if included): Recommendation (or NOT) applicable when conditional if-statement is (or NOT) true.`
b) **Design environment**: Recommendation may NOT be applicable because of:`
   - User characteristics, tasks, environments, technology constraints`
   - Unknown user community, variations in tasks, office environment, screen resolution, lack of pointing device`

**Methods to determine applicabilty**:`
- **System documentation analysis**: Analyze documents describing general/specific presentation of information`
- **Documented evidence**: Analyze relevant documented information about task requirements/characteristics, flow of work, user skills/aptitudes, existing user conventions/biases, test data`
- **Observation**: Examine/inspect presentation of information for presence of particular observable property. Confirmed by another person.`
- **Analytical evaluation**: "Informed" judgments by relevant expert. When system exists only in design documents, user populations NOT available, time/resources constrained.`
- **Empirical evaluation**: Apply test procedures using representative end-users. Prototype/actual system available, potential/actual user population representatives available. Test subjects representative of end-user population, sufficient number to generalize results.`

### A.3 Description of Applicability Methods!

[Detailed descriptions of all 5 methods above with examples]

### A.4 Adherence!

**If recommendation applicable** (per A.2), determine whether adhered to using one or more methods:`
- **Measurements**: Measure/calculate variable concerning presentation of information. Compare obtained value with value stated in recommendation.`
- **Observation**: Examine/inspect presentation of information to confirm particular observable condition consistently applied. Observed property compared with recommendation.`
- **Documented evidence**: Analyze relevant documented information related to adherence.`
- **Analytical evaluation**: "Informed" judgments by relevant expert with skill/experience to judge property & usability of design solution. Verifies design, but does NOT validate (validation only via empirical evaluation).`
- **Empirical evaluation**: Apply test procedures using representative end-users. Analyze task performance of end-users using presentation of information against specific recommendations.`

### A.5 Description of Adherence Methods!

[Detailed descriptions of all 5 methods above with examples]

### A.6 Procedure!

**Decision process** (Figure A.1):`
1. For each recommendation: Check if-condition → Y/N`
2. If Y: Check applicabilty method(s) → Y/N`
3. If Y: Check adherence method(s) → P/F`
4. Calculate Adherence Rating (AR) = (number of P checks) / (number of Y applicabilty checks) × 100%`

**Note**: AR is arithmetic count, NOT reliable measurement of degree of adherence without considering respective weights of items.

### A.7 Checklist (Table A.1)!

**Each recommendation has**:`
- **Recommendation column**: Short version with logic connectors (AND/OR)`
- **Applicability columns**: S (System docs), D (Documented evidence), O (Observation), A (Analytical), E (Empirical), DM (Different Method)`
- **Adherence columns**: M (Measurement), O (Observation), D (Documented), A (Analytical), E (Empirical), DM (Different Method)`
- **Results columns**: Y (Yes), N (No), P (Pass), F (Fail)`
- **Comments column**: Additional statements, source of assessment, describe "Different Methods" when used, relate unique solutions to design recommendations`

## Checklist for ISO 9241-12:1998 Compliance!

### Organization of Information!
□ Information located to meet user expectations & task requirements`
□ Windows appropriate for task/system capabilities`
□ Unique window identification provided`
□ Default window sizes/locations minimize operations`
□ Consistent window appearance (within app & multi-app environment)`
□ Primary/secondary window relationships visually apparent`
□ Window control elements visually discriminable & consistently placed`
□ Overlapping/tiled window format used appropriately`
□ Users allowed to select preferred window format`

### Areas & Density!
□ Areas (identification, input/output, control, message) consistently located`
□ Density NOT perceived as overly cluttered (~40% limit)`

### Input/Output Area!
□ Required information displayed (or partitioned into subsets)`
□ Scrolling/paging provided when information exceeds area`
□ Relative position indicated (scroll bar, "page x of y")`

### Groups!
□ Groups perceptually distinct (spacing, boxes, gestalt principles)`
□ Sequenced to support task order`
□ Follows common formats/conventions`
□ Functional grouping (semantically related)`
□ Visually distinct "chunks" (~5-6 lines, ~10-12 chars, character size NOT decreased)`

### Lists!
□ Logical/natural order (or alphabetic if no order)`
□ Items/groups visually distinct for scanning`
□ Alphabetic info: left-justified (left-to-right languages)`
□ Numeric: right-justified (without decimals), aligned (with decimals)`
□ Fixed font for numeric lists`
□ Numbering begins with "1" (not "0")`
□ Continuous numbering across pages`
□ List continuation indicated ("more", scroll bar)`

### Tables!
□ Most relevant info in leftmost column (left-to-right)`
□ Consistent with paper forms if used in task`
□ Column/row headings visible when table extends beyond area`
□ Facilitate visual scanning (blank lines, colours, lines)`
□ Columns perceptually distinct (~3-5 spaces, lines, colours)`

### Labels!
□ Screen elements labelled (unless meaning obvious)`
□ Labels explain purpose & content`
□ Grammatically consistent`
□ Consistently positioned adjacent to item`
□ Labels distinguishable from associated information`
□ Consistent format & alignment`
□ Units indicated in label or to right of field`

### Fields!
□ Entry & read-only fields visually distinct`
□ Long items partitioned into consistent groups`
□ Entry field format clearly indicated`
□ Entry field length clearly indicated`

### Graphical Objects!
□ Distinctive states via coding techniques`
□ Identical graphical objects get unique text labels`
□ Cursor/pointer: distinctive visual features, NOT obscure characters, stationary until user moves`
□ Cursor "home" position consistent`
□ Initial position in most appropriate entry field`
□ Point designation for accuracy (if required)`
□ Different/Multiple cursors visually distinct`
□ Active cursor visually distinct from inactive`

### Coding Techniques!
□ Codes perceptually distinct & consistently used`
□ Meaningful (mnemonic preferred over arbitrary)`
□ Meaning of code easily accessible`
□ Follows standards/conventional meanings`
□ Rules of code construction: consistent & unambiguous`
□ Code indicates absence (not removed) when information absent`

### Alphanumeric Coding!
□ Short codes (preferably ≤6 chars)`
□ Alphabetic preferred over numeric (unless numeric more meaningful)`
□ Upper/lower-case have same meaning`

### Abbreviations!
□ As short as possible`
□ Some abbreviations shortened without ambiguity`
□ Truncation without ambiguity`
□ ≤10% deviations from rules`
□ Conventional/task-related abbreviations used`

### Graphical Coding!
□ Limited levels/degrees of coding (~3 size codes)`
□ Icons: easily discerned & discriminated`
□ Three-dimensional coding for categories`
□ Unique geometric shapes for each category`
□ Line variations clearly discriminable (~8 combinations)`
□ Line orientation: contextual information provided`

### Colour Coding!
□ NEVER only means of coding (auxiliary only)`
□ NOT discriminately used (avoid "busy"/cluttered)`
□ Each colour = ONE category`
□ Follows familiar conventions (red=warning, yellow=caution, green=OK)`
□ ≤6 colours + black & white`
□ Saturated blue avoided on dark background`
□ Colours discriminable as grey levels on monochrome`
□ Highly saturated extreme wavelengths NOT adjacent for reading tasks`

### Markers!
□ Special symbols for drawing attention`
□ Different markers for single vs. multiple selection`
□ Markers used consistently, NOT for other purposes`
□ Positioned close to items marked, clearly identifiable`

## Relationship with Other ISO 9241 Parts!

| Part | Title | Relationship to ISO 9241-12 |
|---|---|---|
| Part 10 | Dialogue principles | Context of use analysis (ISO 9241-11) |
| Part 11 | Guidance on usability | Context of use analysis |
| Part 12 | **Presentation of information** | THIS PART |
| Part 13 | User guidance | Dialogue techniques (menus, commands, etc.) |
| Part 14 | Menu dialogues | Specific dialogue technique |
| Part 15 | Command dialogues | Specific dialogue technique |
| Part 16 | Direct manipulation dialogues | Specific dialogue technique |
| Part 17 | Form filling dialogues | Specific dialogue technique |
| Part 3 | Visual display requirements | Display hardware requirements |
| Part 8 | Displayed colours | Colour display requirements |

## When to Apply Each Clause!

| Context | Priority Clauses |
|---|---|
| Multiple windows/applications | 5.2 (Windows), 5.3 (Window recommendations) |
| High information density | 5.4 (Areas), 5.6 (Groups), 5.7 (Lists) |
| Data entry tasks | 5.5 (Input/output area), 5.10 (Fields) |
| Tabular data | 5.8 (Tables) |
| Icon/control design | 5.9 (Labels), 6.1 (Graphical objects), 6.2 (Cursors) |
| Coding required | Clause 7 (All coding techniques) |
| Colour-critical tasks | 7.5 (Colour coding) |
| Numeric/alphanumeric | 7.2 (Alphanumeric), 7.3 (Abbreviations) |
