---
name: iso-9241-161
description: Guidance on visual user-interface elements. Use when selecting, designing, or implementing UI elements like buttons, lists, menus, forms, or other visual interface components. Triggers: visual user interface elements, UI elements, user interface design, ISO 9241-161, accordion, button, carousel, check box, date picker, dialogue box, dropdown, entry field, label, link, list, menu, pointer, progress indicator, radio button, scroll bar, table, tab set, toggle button, tooltip, window.
---

# ISO 9241-161:2016 - Guidance on Visual User-Interface Elements

Follow ISO 9241-161:2016 for selecting and using visual user-interface elements in interactive systems.

## Scope!

**Applies to**:`
- Describes visual user-interface elements presented by software`
- Provides requirements/recommendations on when/how to use them`
- Comprehensive list of generic visual UI elements (regardless of platform/implementation)`

**NOT covered**:`
- Detailed design/implementation methods for specific technologies`
- Decorative elements (aesthetic/hedonic only, e.g., background images)`
- Graphical design of elements themselves`

**Intended for**:`
- Those responsible for selection/implementation of visual UI elements`
- Managing platform-specific screen design`
- Human factors/ergonomics + usability professionals`

## Key Terms Defined!

| Term | Definition |
|---|---|
| Accessibility | Usability by people with widest range of capabilities (includes disabilities) |
| Default action | Predefined operation that executes when user activates default mechanism |
| Canvas | Area on screen to present/manipulate data/UI elements/collect user input |
| Click zone | Area activated by input device |
| Deactivation | Operation rendering object unable to receive user input |
| Dialogue | Interaction between user + interactive system (sequence of inputs/outputs) |
| Form element | UI element applicable to forms |
| Form | For/or modifies structured display of fields + other UI elements |
| Hover area | Area sensitive to overlying pointer |
| Hover effect | Change of UI element representation triggered by overlying pointer |
| List | Set of items |
| Navigation | Movement between UI elements within interface |
| Picker/Selector/Chooser | UI element providing means of selecting formatted data |
| Pointing device | Device translating human control operation to display controlling operation |
| State/Status | Distinct condition of an object |
| Touch area | Area sensitive for touch events |
| User-interface element/object | Entity presented by software (text, graphic, control, container) |

## Clause 4: Accessibility!

**Software shall**: Use accessibility services provided by platform (cooperate with assistive technologies per ISO 9241-171:2008, 8.5.3).`

**Important**: Visual UI elements will be used by users unable to interact visually.`

**ALL visual UI elements shall**: Provide alternative text to support accessibility (see ISO/IEC 20071-11 for text alternatives to images).`

**Conformity with ISO 9241-171**: Every applicable requirement + recommendation met (see ISO 9241-171:2008, 7.2 for details).`

## Clause 5: Relationship of Input Methods and Visual UI Elements!

**Visual UI elements may be operated by**:`
- **Typing** (e.g., keyboard)`
- **Pointing** (e.g., mouse, pens, gesture recognition, eye tracking)`
- **Speaking** (e.g., voice commands, voice recognition)`

**ALL visual UI elements shall be operable** by input methods available in interactive system.`

**NOTE**:`
- Keyboard use requires clear visualization of input focus`
- Pointing method (mouse/pen) requires visual pointer`
- Touchscreens do NOT require pointing device (direct manipulation)`
- Input methods may be used singularly or in combination`

**Platform-specific accessibility APIs**: See ISO/IEC 13066 multipart series.`

## Clause 6: States of Visual UI Elements!

**A UI element may have states (status) depending on system status + user interaction. Each state shall be visually clearly distinguishable from ALL other states.**

**States (mutually exclusive when listed together)**:`
1. **Visible vs. Invisible**: User can/cannot see element`
2. **Active vs. Inactive**: Ready/Not ready to receive user input`
3. **Focused vs. Unfocused**: Keyboard events assigned/not assigned to element`
4. **Selected vs. Unselected**: Element has/has NOT been selected`
5. **Checked vs. Unchecked vs. Conditionally checked**: Value set/NOT set/group with both checked/unchecked`
6. **Filled vs. Empty**: Element contains/does NOT contain content`
7. **Pressed vs. Not-pressed**: Element visually appears pressed/NOT pressed (typically on/off state)`
8. **Collapsed vs. Expanded**: Element displayed minimized/maximized (space consumption)`

**NOTE**: There may be other states besides those listed.`

## Clause 7: Describing Visual UI Elements!

**Each element description is structured**:`
1. **Description** - Short explanation of element + purpose`
2. **Components** - Visual assets/UI elements from which element is assembled`
3. **States** - Different states (standard/minimum set; additional possible)`
4. **When to use [Element]** - Identification when appropriate choice (or NOT)`
5. **How to use [Element]** - Guidance on user interaction + incorporating into design`

**NOTE**: Platform-specific guidelines may constrain location/use of UI elements.`

## Clause 8: Visual UI Elements!

### 8.1 Accordion!
**Description**: Assembly of multiple collapsible containers each presenting group of UI elements. Arranged vertically/horizontally (expands vertically/horizontally).`

**Components**:`
- Sections (each with: section label describing section, means to collapse/expand section, canvas displaying section content)`

**Canvas sizes**: 200×200 px, 600×400 px, 1200×800 px, 1920×1080 px`

**States**: Containers collapsible → collapsed OR expanded mode. Depending on implementation: 0, 1, or multiple sections can be expanded at a time.`

**When to use**: IF both true:`
- Available space limited (NOT possible to display all panes at once)`
- Set of panes is static`

**Alternatives if NOT met**:`
- Space NOT limited → consider using a **Group**`
- Set of panes variable → consider **List** or **Table** with detail display`
- Consider **Hierarchical list**, **Menu**, **Tab set**`
- Consider other mechanisms: **Combination box**, **Check boxes**, **Radio buttons**, **Toggle buttons**`

**How to use**: Interaction that expands pane = SAME as interaction that closes pane.`

### 8.2 Analogue Form Element/Slider!
**Description**: Allows user to select value within continuous range (e.g., rotaries dials, sliders).`

**Components**:`
- Label`
- Means to change data in bi-directional way`
- Output of current value (e.g., percentage, tick marks)`

**States**: Active/Inactive.`

**When to use**: IF both true:`
- Bounded values needed as input`
- Enough space in one direction`
- Enough space to visualize values`

**Alternatives if NOT met**: Consider **Stepper**.`
**Alternative if space restricted**: Consider **New Window** with entry fields.`

**How to use**: Analogue form element should be used for input ONLY.`

### 8.3 Carousel/Carrousel!
**Description**: List of elements displayed in circular layout that can be moved along that layout. Closest to front = displayed bigger, others smaller (perspective).`

**Components**:`
- Data elements`
- Means to change focused element (left/right buttons, drag, swipe)`

**States**: Invisible/Visible, Focused/Unfocused.`

**When to use**: IF all true:`
- Unordered/ordered list of data elements of similar type`
- Graphical representation of data to be presented`
- Visualization helps selection decision`
- NO comparison of data required`
- Number of data elements is known`

**Alternatives if NOT met**: Consider **Hierarchical list**. Consider **List box**.`

**How to use**:`
- Presented data should be of same semantic type/homogenous`
- Visual data (rather than alphanumeric) should be used in carousel elements`
- When elements hidden: carousel shall convey clearly means to access this information`
- Carousel should provide as much contextual information as possible (size of data set, current focus)`
- Data should be organized in logical order suitable for task`

### 8.4 Check Box/Check Button!
**Description**: Option that can be on/off, independent choices (multiple can be checked). Mutually independent (selecting one does NOT affect others).`

**Components**:`
- Indicator (whether option is checked)`
- Label (what the option is)`

**Canvas sizes**: • X Choice Number 1, • b (label)`

**States**: Focused/Unfocused, Active/Deactivated, Editable/Display only, Checked/Unchecked/Conditionally checked.`

**When to use (choosing values)**: IF all true:`
- Choices are NOT exclusive (more than one can be selected)`
- Maximum choices should NOT exceed 10 (unless structured in groups/sets)`
- Number of choices is static`

**When to use (indication in lists)**: IF all true:`
- Choices are NOT exclusive (more than one can be selected)`
- Number of choices varies`

**Alternatives if NOT met**: Consider **Dropown list box**.`

**How to use**:`
- Check boxes sharing same contextual meaning shall be presented showing shared association`
- Relation realized by showing dependent choices in grouping element OR using law of proximity`
- Visualization of indicator shall be consistent (always use "x" OR always use "✓")`
- Shall NOT convey other selection states than: selected, conditionally selected, unselected`
- States shall be realized to clearly differentiate states`

### 8.5 Collapsible Container!
**Description**: Contains group of other UI elements that can be visually expanded/collapsed.`

**Components**:`
- Label of container`
- Means to collapse or expand container`
- Indicator (expanded/collapsed status)`
- Canvas to display content`
- Data elements/other UI elements`

**Canvas sizes**: 200×200 px, 600×400 px, 1200×800 px, 1920×1080 px`

**States**: Collapsed/Expanded.`

**When to use**: IF all true:`
- Limited space`
- Data belongs to same semantic set`
- Necessary to reduce complexity of UI`

**How to use**: Interaction that expands = SAME as interaction that closes.`

### 8.6 Colour Picker!
**Description**: Presents selectable colours to user.`

**Components**:`
- Selectable colours (discrete OR continuous choices)`
- Indicator visualizing current selection`
- History of previously chosen colours (optional)`

**States**: Active/Deactivated.`

**When to use**: IF all true:`
- Large number of available colours (>16)`
- Complex colour settings available (saturation, brightness, hue)`
- Selecting multiple colours from colour palette`

**How to use**:`
- If selectable colours are continuous: alternative picking methods should be available (pointer OR entering RGB data)`
- Provision of previously selected colours/palettes optimizes colour contrast for discriminability`

### 8.7 Combination Box/Combo Box!
**Description**: Combines text field + list box. User types OR selects from list (which fills text field).`

**Components**:`
- Label`
- Entry field`
- Cursor`
- Means to expand list (list button)`
- Indicator (expanded/collapsed status)`
- Selection cursor (when expanded)`
- List (when expanded)`

**States**: Focused/Unfocused, Active/Deactivated, Filled/Empty, List collapsed/expanded.`

**When to use**: IF all true:`
- Desired result = selection/setting state/assigning value`
- Choices are mutually exclusive`
- Limited space`
- Users need to see which option currently selected`
- 5+ items OR number may change over time`
- Users may type entry more quickly than select it`
- UI may have to type values NOT supplied by application`

**How to use**: Combination box shall ONLY present selectable data. Data presented should be in persistent sorted order.`

### 8.8 Cursor!
**Description**: Visual indication of where user interaction via keyboard (or emulator) will occur.`

**Components**: Visual indicator identifying where interaction will occur.`

**Text| Text_ | Key: a visual indicator**`

**States**: No states, but can visualize interaction modes (insert mode, overwrite mode).`

**When to use**: IF: User edits/inputs alphanumeric information.`

**How to use**: Inside text input elements, cursor shall highlight where next interaction will occur.`

### 8.9 Date Picker!
**Description**: Displays days, months, years for selection to define specific date.`

**Components**:`
- Identifiers visualizing selected day, month, year`
- Means to select year, month, day`
- Entry field with label (optional)`

**Calendar display**: Mon Tue Wed Thu Fri Sat Sun, 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31`

**States**: Active/Deactivated, Focused/Unfocused. Days also: Active/Deactivated, Focused/Unfocused, Selected/Unselected.`

**When to use**: IF: Specific date is to be identified by user (only ONE date).`

**Alternatives**: Consider **Entry field** OR **List box** if more dates needed.`

**How to use**:`
- Month + year should be independently selectable`
- Realization shall follow date conventions of local culture`
- User should be able to set preferred date format (ISO 8601 for guidance)`
- Calendar should visualize selected ("picked") date + adjacent days of previous/next month`
- Click on "December" → access list of months`
- Click on "2012" → access list of years`
- Left arrow → navigate to previous month, Right arrow → next month`

### 8.10 Dialogue Box!
**Description**: Subordinate type of form (typically separate window) supplementing/supporting interaction in main application dialogue.`

**Components**:`
- Title`
- Information related to application dialogue`
- Push button with default action (optional, with implicit designator)`
- Means to dismiss dialogue (optional, depending on context)`

**Question**: "We need to collect some information about your account and your identity."**
Buttons**: Cancel | Continue**`

**Key**: a) title, b) information, c) push button with default action, d) means to dismiss dialogue**`

**States**: Focused/Unfocused, Active/Deactivated.`

**When to use**: IF both true:`
- Explicit user decision/action/data entry required`
- Question affects whole application`

**How to use**:`
- Dialogue box shall be presented/appear on topmost visual layer`
- User should be able to hide/dismiss whenever presence is NOT contextually essential`

### 8.11 Dropdown List Box!
**Description**: Combines field + list box. User selects from list (which fills text field).`

**Components**:`
- Label`
- Data field (showing current active selected data from list)`
- Means to expand list (list button)`
- Indicator (expanded/collapsed status)`
- List (when expanded)`

**List**: Item 1, Item 2, Item 3, Item 4, Item 5, Item 6, Item 7, Item 8, Item 9**`

**Key**: a) label, b) data field, c) list button, d) indicator, e) list**`

**States**: Focused/Unfocused, Active/Deactivated, Filled/Empty. List: Collapsed/Expanded.`

**When to use**: IF all true:`
- Desired result = selection/setting state`
- Choices are mutually exclusive`
- Limited space`
- Except when changing selection: users need to see ONLY item currently selected`
- 4+ items OR number may change over time`
- ALL values can be supplied by application`

**How to use**:`
- When inactive: display SINGLE value`
- When activated: display (drops down) list of values for user selection`
- When user selects new value: control reverts to inactive state displaying selected value`

### 8.12 Entry Field/Input Field!
**Description**: Field where users can input/edit data.`

**Components**:`
- Label`
- Field (with boundaries)`
- Cursor (within boundaries)`

**Example**: Last Name: ___________ Moncrief**`

**Key**: a) label, b) field, c) cursor**`

**States**: Focused/Unfocused, Active/Deactivated, Filled/Empty.`

**When to use**: IF: System needs information from user that cannot be presented as predefined choices.`

**How to use**: Boundaries of entry field shall be clearly visualized (e.g., by contrast, colour, box).`

### 8.13 Entry Field with Dialogue Button!
**Description**: Combination of entry field + push button. Push button functionality executed on information entered in field.`

**Components**:`
- Label`
- Field (with boundaries)`
- Cursor (within boundaries)`
- Push button`
- Contextual information (e.g., data entry is mandatory; optional)`

**Example**: City: YourCity | Search**`

**Key**: a) label, b) field, c) cursor, d) push button**`

**States**: States of entry field AND button in all combinations.`

**When to use**: IF: Keyboard input for system operation needed + input cannot be realized by predefined choices.`

**How to use**: Boundaries of entry field shall be clearly visualized (e.g., by contrast, colour, box).`

### 8.14 Geographical Map!
**Description**: Presents geographical information + enables interaction with different geographical elements.`

**Components**:`
- Label`
- Geographical information:`
  - 1) Graphical representation of areas/regions`
  - 2) Textual information of areas/regions (optional)`
  - 3) Visual information related to geographical properties (optional)`
- Legend (optional)`

**MapLabel | Key: a) label, b) geographical information, c) legend (optional)**`

**States**: Active/Deactivated.`

**When to use**: IF: Geographical information is to be presented.`

**How to use**:`
- Implement geographical conventions if applicable (north up, clear distinction of areas, enable zoom in/out)`
- Alternative text for accessibility`

### 8.15 Group/Group Box!
**Description**: Visualizes that information items/UI elements belong to same semantic set.`

**Components**:`
- Label describing semantic set`
- Data elements`

**Example**: Select Option • Option A • Option B • Option C**`

**Key**: a) label, b) data elements**`

**States**: Filled/Empty, Visible/Invisible.`

**When to use**: IF all true:`
- Visualization of semantic grouping required`
- So many UI elements that visual structuring increases efficiency of information consumtion`
- Semantic sets of UI elements can be clearly identified`

**Alternatives if NOT met**:`
- Space NOT limited → consider **Accordion**`
- Set of panes variable → consider **Hierarchical list**, **Menu**, **Tab set**`
- Restricted space → consider other mechanisms: **Combination box**, **Check boxes**, **Radio buttons**, **Toggle buttons**`

**How to use**: Group shall contain MORE than one element. Presented in way that clearly depicts relation of ALL elements.`

### 8.16 Handle!
**Description**: Identifies areas of visual information that can be used to manipulate properties.`

**Components**: Visual indicator (handle).`

**Example**: Rectangle with handles in all four corners**`

**Key**: a) visual indicator**`

**States**: Visible/Invisible, Active/Deactivated, Pressed/Not-pressed.`

**NOTE**: Typically, visibility + focus coupled: handle becomes visible when corresponding area has keyboard focus, disappears when focus transferred. When pointer available: hovering changes pointer to indicate possible interaction.`

**When to use**: IF: Pointer device available + properties of displayed elements can be changed in linear way.`

**Alternatives**: Consider **Properties dialogue**.`

**How to use**: Handle shall be visualized to enable clear differentiation between handle + element being manipulated. Provide alternative means to manipulate properties.`

**Example**: Size of rectangle changed by pointer using handle in lower right corner. Properties dialogue also available for data entry.`

### 8.17 Hierarchical List/Tree View/Tree Lists!
**Description**: Series of lists structured in hierarchical/"tree-like" manner. Selection of initial item leads to another list (which may lead to another, etc.).`

**Components**:`
- Label`
- Data elements`
- Indicators visualizing hierarchical position in data structure`
- Means to expand/collapse levels of hierarchy (optional)`

**Example**: Tree structure with Branch 1, Branch II, Branch IV (with Twig IV-A, Twig IV-B, Twig IV-C)**`

**Key**: a) label, b) data elements, c) indicators, d) means to expand/collapse levels**`

**States**: Filled/Empty. Nodes: Collapsed/Expanded.`

**When to use**: IF all true:`
- Ordering data elements that have inherent hierarchical structure/relation (e.g., file system, headings in document)`
- NOT all data elements have to be visible at all times`

**Alternatives**: Consider **Hierarchical list**. Consider **List box**.`

**How to use**:`
- Presented data should be of same semantic type/homogenous`
- Visual data (rather than alphanumeric) should be used`
- When elements hidden: shall convey clearly means to access this information`
- Hierarchical list should provide as much contextual info as possible (size of data set, current focus)`
- Data should be organized in logical order suitable for task`

### 8.18 Implicit Designator!
**Description**: Portion of option name/control label used for keyboard selection.`

**Components**: Indicator visualizing available keyboard selection.`

**Example**: Push button with underlined "A" in label "Action" → pressing "A" activates button**`

**Key**: a) indicator**`

**States**: Inherits state from corresponding functional element. Also: Visible/Invisible.`

**When to use**: IF: Keyboard is available input method.`

**How to use**:`
- Implicit designator shall be realized to make it detectable + distinctive from respective UI element`
- Shall have explicit key mapping`
- Shall clearly identify relation of implicit designator + respective UI element`
- Access to implicit designator should be consistent within interactive system`

### 8.19 Instructive Information!
**Description**: Provides users with additional guiding info on how to use UI, context of use.`

**Components**: Information in alphanumeric and/or graphical form.`

**Example**: "Please type your PIN and press Enter" with PIN: ****, Enter your PIN with care**`

**Key**: Information in alphanumeric and/or graphical form**`

**States**: Visible/Invisible.`

**When to use**: IF any true:`
- Further info useful to understand use of interactive system, context, environment`
- Further info needed beyond title, label, other UI elements`
- When considering accessibility`

**How to use**:`
- Every user-interface element EXCEPT Pointer shall have a label`
- Instructional information should NOT be used as alternative to good UI design`
- Shall be available for assistive technologies`
- Within application: provision of previously selected colours/palettes optimizes colour contrast for discriminability`

### 8.20 Input Tokenizer!
**Description**: Information in entry field interpreted by system to point to meta-information.`

**Components**:`
- Label`
- Entry field`
- Labelled token`
- Means to turn entered information into token`

**Example**: Restaccount (Dummy) → To: Testaccount (Dummy) → 4**`

**Key**: a) label, b) entry field, c) labelled token, d) means to turn entered info into token**`

**States**: Focused/Unfocused, Active/Deactivated, Filled/Empty.`

**NOTE**: Before turned into token: input text appears/behaves as ordinary entry field.`

**When to use**: IF: Link to complex set of data is required.`

**How to use**: Input tokenizer should be designed to clearly identify its nature. Input tokenizer is NOT editable.`

### 8.21 Label!
**Description**: Short descriptive title for entry/readonly field, table, control, other UI element.`

**Components**: Text or graphical element.`

**Example**: Save (button label)**`

**Key**: a) text or graphical element**`

**States**: Visible/Invisible.`

**NOTE**: Invisible labels need to be accessible to assistive technology (screen readers). Label should only be invisible if enough context presented to make it obvious.`

**When to use**: Every UI element EXCEPT Pointer shall have a label. Essential for assistive technologies.`

**How to use**: Labels should be short + concise. Design shall support both legibility + readability. Visualized to distinguish role as label from other text.`

### 8.22 Legend/Chart Key!
**Description**: Describes visualized data.`

**Components**:`
- Label of legend`
- Key visualizing visualized data`

**Example**: Chart with legend showing data elements**`

**Key**: a) label of legend, b) key visualizing visualized data**`

**States**: Visible/Invisible.`

**NOTE**: Invisible legends need to be accessible to assistive technology.`

**When to use**: IF: Data elements are to be explained + coding of data elements is to be explained.`

**How to use**: Legend shall present information for ALL visualized data.`

### 8.23 Link/Hyperlink!
**Description**: Allows navigation to specified location within interactive system.`

**Components**:`
- Alphanumeric or graphical information`
- Visual indicator declaring info is a link`
- Reference address of specified location`

**Example**: Text with link to "The novel is based on the last days of the Roman Empire, especially in the nobility around Marc Antony and its opponent Octavian who later became the first roman emperor"**`

**Key**: a) alphanumerical or graphical information, b) visual indicator, c) reference address**`

**States**: Focused/Unfocused, Active/Deactivated. Days also: Unvisited/Visited.`

**When to use**: IF any true:`
- Navigation to another page`
- Navigation to another service`
- Reference description is longer than a label`

**Alternative**: Consider **Push button**.`

**How to use**:`
- Designed to differentiate clearly from regular text/other UI elements`
- Very often: dedicated text colour + underlined text and/or font`
- May be activated by system based on time, system condition, etc.`
- Further information: ISO 14915-2:2003, Clause 8`

### 8.24 List Box!
**Description**: Provides presentation (usually vertical) of items from which user can select ONLY ONE (single selection) OR can select MORE than one (multiple selection).`

**Components**:`
- Label`
- Data items`
- Canvas to display data items (with boundaries)`
- Scroll bar (for longer lists, optional)`

**List**: Select Item 1, Item 2, Item 3, Item 4, Item 5, Item 6, Item 7, Item 8, Item 9**`

**Key**: a) label, b) data items, c) canvas, d) scroll bar**`

**States**: Active/Deactivated. List items: Focused/Unfocused, Selected/Unselected.`

**Single selection when to use**: IF all true:`
- Desired result = making selection/setting state`
- Choices are mutually exclusive`
- Adequate space to display 3+ items simultaneously without scrolling`
- 5+ items OR number may change over time`
- Users need to see which option currently selected`
- Value in having number of choices simultaneously visible`
- Number of items might change dynamically`

**Multiple selection when to use**: IF all true:`
- Desired result = making selection/setting one or more states`
- Choices are NOT mutually exclusive`
- Adequate space to display 3+ items simultaneously without scrolling`
- 5+ items OR number may change over time`
- Users need to see which options currently selected`
- Value in having number of choices simultaneously visible`
- Number of items might change dynamically`

**How to use**: Boundaries of list box shall be clearly visualized (e.g., by contrast, colour, box). List should display at least 3 items when scroll bar used.`

### 8.25 List Button/Menu Button!
**Description**: Used to access a list → when button pressed, dropdown list of items displayed.`

**Components**:`
- List box`
- Push button`
- Indicator (expanded/collapsed status)`

**Example**: Entry 1, Entry 2, Entry 3, Entry 4, Entry 5, Entry 6, Entry 7, Entry 8, Entry 9**`

**Key**: a) list box, b) push button, c) indicator**`

**States**: Active/Deactivated, Focused/Unfocused.`

**When to use**: IF one or both true:`
- Limited space for display of list box`
- Multiple lists are to be displayed`

**How to use**: List button shall be visualized to communicate relation to list being accessed.`

### 8.26 Menu/Menu Bar!
**Description**: Represents set of selectable options giving access to objects/actions. Primarily provides access to functions/specified locations.`

**Components**:`
- Menu items:`
  - Labels corresponding to each selectable object/action`
  - Selectable objects/actions`
- Title of menu (optional)`
- Instructional information (optional)`

**Example**: Menu1: Object1.1, Action1.1, Object1.2, Action1.2... Menu2: Object2.1, Action2.1...**`

**Key**: a) labels/selectable objects/actions, b) title (optional), c) instruction (optional)**`

**States**: Visible/Invisible, Active/Deactivated. Menu items: Active/Deactivated, Focused/Unfocused, Checked/Unchecked/Conditionally checked.`

**When to use**: IF one or more true:`
- User selects system function`
- User navigates to specified location`

**Alternatives**: Consider **List box**, **Combo box**, **Carousel**.`

**How to use**:`
- Functions + segments shall be grouped according to context`
- Depending on context: offer contextual help on how to use menu (tool tip, text)`
- Menu may offer access to secondary set of selectable options/actions (e.g., cascading presentation)`
- Shall implement conventions if applicable (e.g., File, Edit, View, Help structure)`

### 8.27 Output Pane!
**Description**: Displays variable information. User CANNOT edit this displayed information.`

**Components**:`
- Label`
- Data`

**Example**: Current Temperature: 25° C**`

**Key**: a) label, b) data**`

**States**: Visible/Invisible.`

**When to use**: IF: Non-editable data is to be displayed.`

**How to use**: Output pane shall be realized to clearly depict non-editable nature of displayed data.`

### 8.28 Pointer!
**Description**: Graphical symbol moved on screen according to operations with pointing device. Users interact with elements by moving pointer to location + starting direct manipulation.`

**Components**: Graphical symbol.`

**Example**: Arrow cursor, crosshair, V-shaped symbol**`

**Key**: a) graphical symbol**`

**States**: No states. Can visualize interaction modes (draw, drag, resize, etc.). Pointer symbol can visualize various user interaction modes.`

**NOTE**:`
- Pointer becomes visible when corresponding area has keyboard focus, disappears when focus transferred`
- When pointer available: hovering changes pointer to indicate possible interaction`
- Manipulation events (clicking button) visualized in affected control (button changes to pressed state)`

**When to use**: IF: Pointer device is available.`

**How to use**: Pointer shall be designed to be clearly detectable + distinguishable from other UI elements/content. System should provide means for user to individualize pointer speed.`

### 8.29 Pop-up Menu/Contextual Menu!
**Description**: Menu with contextual functions, presented in foreground of UI + close to current cursor position.`

**Components**:`
- Menu items:`
  - Labels corresponding to each selectable object/action`
  - Selectable objects/actions`
- Canvas to display menu items (within boundaries)`
- Shadow (optional, for visual effect)`

**Example**: Text with pop-up menu showing Bold, Italic, Underline options**`

**Key**: a) menu items, b) canvas, c) shadow (optional)**`

**States**: Visible/Invisible. Menu items: Active/Deactivated, Focused/Unfocused, Selected/Unselected, Checked/Unchecked/Conditionally checked.`

**When to use**: IF: Contextual functions are available + contextual functions are to be executed on highlighted/selected data.`

**How to use**: Pop-up menu shall be realized to clearly differentiate from underlying UI/data. Contextual functions shall be accessible by other means than pop-up menu.`

### 8.30 Progress Indicator!
**Description**: Visualizes status of operation/process.`

**Components**:`
- Label`
- Visualization of progress status`
- Data on extent of progress (optional, e.g., percentage)`

**Example**: Installing DemoApp... 05%**`

**Key**: a) label, b) visualization of progress status, c) data on extent of progress (optional)**`

**States**: No special states.`

**When to use**: IF both true:`
- User is to be informed about ongoing process`
- Progress of process is of semantic/contextual interest to user`

**How to use**: Progress indicator should be designed to NOT be mistaken for a Slider.`

### 8.31 Prompt!
**Description**: Requires user to enter a command.`

**Components**:`
- Label`
- Field (with boundaries)`
- Cursor`
- Means to execute entered command (optional, e.g., Enter key or dialogue button)`

**Example**: ?: show help**`

**Key**: a) label, b) field, c) cursor, d) means to execute command**`

**States**: Active/Deactivated.`

**When to use**: IF: Keyboard input for system operation needed + input cannot be realized by predefined choices.`

**How to use**: Prompt should be visualized to indicate where user input takes place.`

### 8.32 Push Button/Command Button!
**Description**: Used for executing immediate command or action.`

**Components**:`
- Label describing command or action`
- Canvas to present the label`

**Example**: Print? | Search**`

**Key**: a) label, b) canvas**`

**States**: Focused/Unfocused, Active/Deactivated, Pressed/Not pressed.`

**NOTE**: Sometimes referred to as command button.`

**When to use**: IF: Command/action is to be initiated.`

**How to use**:`
- Every push button shall have a label`
- Label should be short + concise`
- If additional information needed: design of push button should reflect that`
- Shall be activated by SINGLE activation event (mouse click, touch) NOT double click`
- Further information: ISO 14915-2:2003, Clause 11`

### 8.33 Radio Button!
**Description**: Used to select option from group of mutually exclusive options ("one of many" choice, exactly ONE option selected at any time). In group: selecting one = deselecting any different one.`

**NOTE**: Contrast with check box (multiple can be selected).`

**Components**:`
- Indicator (whether option is checked)`
- Label (what the option is)`

**Example**: • Option A, • Option B, • Option C**`

**Key**: a) indicator, b) label**`

**States**: Focused/Unfocused, Active/Deactivated, Editable/Display only, Checked/Unchecked/Conditionally checked.`

**When to use**: IF all true:`
- Choices are exclusive (only one choice can be selected)`
- Maximum choices should NOT exceed 10 (unless structured in groups/sets)`
- Number of choices is static`
- Options are non-numeric`
- ALL options need to be considered at once`

**Alternatives**:`
- Choices NOT exclusive + can select multiple → consider **Check box**`
- Maximum choices >10 → consider **List box/Combination box**`
- Number of choices varies → consider **List box/Combination box**`
- Options are numeric → consider **Stepper/Spin button/Slider**`

**How to use**:`
- Radio buttons sharing same contextual meaning shall be presented showing shared association`
- Relation realized by showing dependent choices in grouping element OR using law of proximity`
- Visualization of indicator shall be consistent (always use "•" OR always use "○")`
- Shall NOT convey other selection states than: selected, conditionally selected, unselected`
- Different states shall be realized to clearly differentiate states`

### 8.34 Read Only Field/Protected Field!
**Description**: Contains data that CANNOT be modified by user.`

**Components**:`
- Label`
- Entry field`
- Data`

**Example**: Status: Married**`

**Key**: a) label, b) entry field, c) data**`

**States**: Focused/Unfocused, Filled/Empty.`

**When to use**: IF: Alphanumeric data is to be presented + contextually is NOT to be edited.`

**How to use**: Read only field shall be able to take focus to enable reading content via assistive technology. Design shall clearly depict read-only nature.`

### 8.35 Scroll Bar!
**Description**: Allows user to view objects extending beyond available display area by moving them into/out of displayed area. Indicates whether additional information available + relative position.`

**Components**:`
- Scroll handle`
- Slide track`
- Up button`
- Down button`

**Key**: a) scroll handle, b) slide track, c) up button, d) down button**`

**Example**: Vertical scroll bar**`

**States**: Visible/Invisible. Alternatively: scroll handle + up/down buttons can be Active/Deactivated.`

**NOTE**: Hiding scroll bar altogether preferable to deactivating its elements.`

**When to use**: IF one or both true:`
- List is to be presented`
- Limited space available to present list`
- Size of list exceeds visible area on screen`

**How to use**: Scroll bar should be available when corresponding list gets input focus. Position of scroll handle on scroll bar should represent position of visible part of displayed/scrolled content. Display size of handle should be relative to view's current size.`

### 8.36 Scroll Handle/Elevator/Scroll Box/Thumb!
**Description**: Within scroll bar, allows user to move to specific region of displayed file by dragging rectangle to appropriate location.`

**Components**: Visual indicator (handle within scroll bar).`

**Example**: Horizontal scroll bar with handle**`

**Key**: a) visual indicator**`

**States**: Active/Deactivated.`

**When to use**: IF: Pointer device available.`

**How to use**:`
- Scroll handle shall be realized for respective scroll bar`
- Position on scroll bar should represent position of visible area of displayed content`
- Display size should be relative to view's current size`
- Within interactive system: access to scroll handle should be consistent`

### 8.37 Selection Cursor!
**Description**: Indicates item whose selection state can be changed by defined confirming action.`

**Components**: Visual indicator showing current position of selection.`

**Key**: a) visual indicator**`

**States**: Inherits state from corresponding functional element. Also: Visible/Invisible.`

**When to use**: IF: Keyboard is available input method.`

**How to use**:`
- Selection cursor shall be realized to make it detectable + distinctive from respective UI element`
- Shall have explicit key mapping`
- Shall clearly identify relation of selection cursor + respective UI element`
- Within interactive system: access to selection cursor should be consistent`

### 8.38 Selection Indication!
**Description**: Visual/other cue indicating selected element on display whose selection state can be changed.`

**Components**: Visual indicator showing current selection.`

**Key**: a) visual indicator**`

**States**: Inherits state from corresponding functional element. Also: Visible/Invisible.`

**When to use**: IF: Visual UI element can be selected.`

**How to use**:`
- Selection indication shall be realized to make it detectable + distinctive from respective UI element`
- Shall clearly identify relation of selection indication + respective UI element`
- Within interactive system: access to selection indication should be consistent`

### 8.39 Selection List/Choice List!
**Description**: Presented as list containing items from which user can select ONLY ONE (single) OR MORE than one (multiple).`

**When to use (single)**: IF all true:`
- Desired result = making selection/setting state`
- Choices are mutually exclusive`
- Adequate space to display 3+ items simultaneously without scrolling`
- 5+ items OR number may change over time`
- Users need to see which option currently selected`
- Value in having number of choices simultaneously visible`

**When to use (multiple)**: IF all true:`
- Desired result = making selection/setting one or more states`
- Choices are NOT mutually exclusive`
- Adequate space to display 3+ items simultaneously without scrolling`
- 5+ items OR number may change over time`
- Users need to see which options currently selected`
- Value in having number of choices simultaneously visible`

**How to use**: Selection list shall ONLY present selectable data. Data presented should be in persistent sorted order.`

### 8.40 Status Information!
**Description**: Used to describe a status.`

**Components**: Output pane.`

**Example**: Document status: 8 words, 1 page - Version from 2012-12-25, showing also adjacent days of previous and following month**`

**Key**: Output pane**`

**States**: Visible/Invisible.`

**When to use**: IF: Data is to be explained.`

**How to use**: Status information shall reference context of use from which it was accessed/presented.`

### 8.41 Stepper/Spin Button!
**Description**: Allows user to move through available alternatives, options, or values ONE at a time.`

**Components**:`
- Identifier visualizing selected day/month/year`
- Increment push button`
- Decrement push button`
- Output pane (optional, for displaying value)`

**Example**: 101 A (with increment/decrement buttons)**`

**Key**: a) increment push button, b) decrement push button, c) output pane**`

**States**: Active/Deactivated.`

**When to use**: IF: List of available data is continuous.`

**How to use**:`
- If available data >10: entry field should be used in conjunction with stepper button`
- User should be able to set preferred format (ISO 8601 for guidance)`

### 8.42 System Message!
**Description**: Provides messages of interactive system for user.`

**Components**:`
- Title`
- Information related to application dialogue`
- Means to dismiss system message (optional, depending on context)`

**Example**: "Please wait while we are preparing your system..."**`

**Key**: a) title, b) information, c) means to dismiss dialogue**`

**States**: Filled/Empty.`

**When to use**: IF: Important that user is informed about system event.`

**How to use**:`
- System message shall convey if user has to take action`
- Shall present available actions for user if required`
- Designed to clearly differentiate from other content/data/UI elements`
- User should be able to hide/dismiss whenever presence is NOT contextually essential`

### 8.43 Tab Set!
**Description**: Uses metaphor of index cards with tabs to identify them. Each tab has associated set of displayed information/controls. Selection of different tab allows movement among information/options.`

**Components**:`
- Label of Tab set`
- Label per Tab ("index card")`
- Canvas per Tab to present content of tab`

**Example**: Tab1, Tab2, Tab3 (with content for each tab)**`

**Key**: a) label of Tab set, b) label per Tab, c) canvas per Tab**`

**States**: Each tab: Active/Deactivated, Focused/Unfocused, Selected/Unselected.`

**When to use**: IF all true:`
- Available space is limited (NOT possible to display all panes at once)`
- Enough space to clearly identify each tab`

**Alternatives if NOT met**:`
- Space NOT limited → consider **Group**`
- Set of panes variable → consider **Hierarchical list**, **Menu**`
- Restricted space → consider **Accordion**, other mechanisms`

**How to use**:`
- Tabs belonging to same tab set shall be presented to depict shared association`
- Visualization of active tab shall clearly indicate active state`
- Number of rows of tabs should be minimized`
- Tabbed dialogue should NOT contain another tab set`

### 8.44 Table!
**Description**: Ordered combination of fields arranged in columns + rows.`

**Components**:`
- Title`
- Labels`
- Fields`

**Example**: Quarterly Overview table with rows (Q1, Q2, Q3, Q4) and columns (Sales, Costs, Profit)**`

**Key**: a) title, b) labels, c) fields**`

**States**: Filled/Empty. Fields/buttons/selection indicators can have their own states.`

**When to use**: IF one or more true:`
- Data objects/items consist of more than one information per object`
- Large number of data to be displayed`

**How to use**:`
- Label of row/column should be presented to clearly differentiate from data in table`
- If keyboard available: should be possible to navigate in table with arrow keys`
- Table shall enable assistive technologies access to its data`

### 8.45 Text Field!
**Description**: Allows user to enter character-based data.`

**Components**:`
- Label`
- Field (with boundaries)`
- Cursor (within boundaries)`

**Example**: How do you feel today? - ________ YourCity. **`

**Key**: a) label, b) field, c) cursor**`

**States**: Focused/Unfocused, Active/Deactivated, Filled/Empty.`

**When to use**: IF: System needs information from user that cannot be presented as predefined choices.`

**How to use**: Boundaries of text field shall be clearly visualized (e.g., by contrast, colour, box).`

### 8.46 Time Picker!
**Description**: Enables user to select specific time.`

**Components**:`
- Label`
- List of hours`
- List of minutes`
- Means to select hours, minutes (and optional: seconds)`
- Data on extent of progress (optional, e.g., 05:30:00)**`

**Key**: a) label, b) list of hours, c) list of minutes, d) data on extent of progress**`

**States**: Active/Deactivated, Focused/Unfocused.`

**When to use**: IF: Specific time is to be identified by user (only ONE time).`

**Alternatives**: Consider **Entry field** OR **List box** if more times needed.`

**How to use**:`
- Realization shall follow time conventions of local culture`
- User should be able to set preferred time format (ISO 8601 for guidance: 24h vs. 12h format)`

### 8.47 Title!
**Description**: Text that headlines UI of part of interactive system.`

**Components**: Text.`

**Example**: Testprogram**`

**Key**: a) text**`

**States**: Visible/Invisible.`

**NOTE**: Invisible titles need to be accessible to assistive technology (screen readers). Title should only be invisible if enough context presented to make it obvious.`

**When to use**: IF: User interface uses windows + content presentation is making use of full screen.`

**How to use**: Title should be presented in way that indicates difference to other UI elements. Within interactive system: access to title should be consistent.`

### 8.48 Toggle Button!
**Description**: Provides choice between two states (set/unset, popped in/out).`

**Components**:`
- Push button`
- Visual indicator to communicate two status: NOT toggled (toggle off) / Toggled (toggle on)`

**Example**: Traffic signal with Toggle Status 1 (NOT toggled) / Toggle Status 2 (toggled)**`

**Key**: a) push button, b) visual indicator**`

**States**: Focused/Unfocused, Active/Deactivated, Pressed/Not pressed.`

**When to use**: IF: Property of system is either true OR false.`

**How to use**:`
- Toggle button shall be presented to clearly depict relation of all elements`
- Relation realized using law of proximity`
- Visualization of two states shall be consistent`
- Shall clearly differentiate the states`
- Within design solution: representation of toggle button shall be consistent`

### 8.49 Tool Bar!
**Description**: Collection of actions enabling user to manipulate content within interactive system.`

**Components**:`
- List of actions`
- Canvas to present list of actions`
- Means to hide/remove tool bar (optional)`

**Example**: Tool bar for text editing tools**`

**Key**: a) list of actions, b) canvas**`

**States**: Toolbar can be used to control states of ALL toolbar elements simultaneously. Can be: Visible/Invisible, Active/Deactivated.`

**When to use**: IF both true:`
- Set of actions is used frequently to manipulate content`
- Set of actions is limited`

**How to use**:`
- If user may need to use display space occupied by tool bar for other purposes: provide means of hiding/removing tool palette`
- Application should allow users to choose where to position tool bar`

### 8.50 Tool Tip!
**Description**: Additional textual information/label on specific UI element accessed by specific user interaction.`

**Components**: Information in alphanumeric and/or graphical form.`

**Example**: Please type your PIN and press Enter (with PIN field)**`

**Key**: Information in alphanumeric and/or graphical form**`

**States**: Visible/Invisible.`

**When to use**: IF any true:`
- UI elements do NOT have visible label`
- Additional description of UI element improves use of system`

**Alternatives**: Consider **Label**.`

**How to use**:`
- Tool tip shall NOT obstruct respective UI element`
- Shall be available for assistive technologies`
- Within application: access to tool tip should be consistent`

### 8.51 Window!
**Description**: Dedicated rectangular pane containing other UI elements. Can overlap area of other windows.`

**Components**:`
- Title`
- Canvas to display content of window`
- Frame (indicator visualizing borders of window)`
- Means to minimize, maximize, or close window (optional)`

**Example**: Two overlapping windows**`

**Key**: a) title, b) canvas, c) frame, d) means to minimize/maximize/close**`

**States**: Active/Deactivated, Focused/Unfocused, Collapsed/Expanded/Maximized.`

**When to use**: In platform that uses paradigm to present applications/dialogues in windows (Graphical User Interfaces).`

**How to use**:`
- Clicking on canvas/title of window shall move that window to top layer + window shall be active + ready for input`
- Window shall be visualized in way that indicates whether active/inactive`

## Annex A: Choosing Visual UI Elements!

**Decision table** (summary of when to use each element):

| Element | Best Used When |
|---|---|
| Accordion | Limited space, static panes |
| Analogue form (Slider) | Continuous range, enough space for values |
| Carousel | Circular list of similar graphical items |
| Check box | Multiple independent choices (≤10 static) |
| Collapsible container | Group of elements, limited space |
| Colour picker | Large colour palette (>16 colours) |
| Combo box | Mutually exclusive, limited space, 5+ items |
| Cursor | User edits/inputs alphanumeric |
| Date picker | ONE specific date to identify |
| Dialogue box | Explicit decision affects whole app |
| Dropdown list | Mutually exclusive, limited space, 4+ items |
| Entry field | Free text input (not predefined) |
| Entry field + dialogue | Free text + command execution |
| Geographical map | Geographical information presentation |
| Group | Semantic grouping, many UI elements |
| Handle | Pointer available, linear property change |
| Hierarchical list | Inherent hierarchical data structure |
| Implicit designator | Keyboard available, for selection |
| Instructive information | Additional guidance needed |
| Input tokenizer | Link to complex data set |
| Label | ALL elements EXCEPT Pointer |
| Legend | Explain coded data elements |
| Link/Hyperlink | Navigation to location, long description |
| List box | Single/multiple selection, 3+ items visible |
| List button | Access list, limited space |
| Menu | Select function, navigate to location |
| Output pane | Display non-editable data |
| Pointer | Pointing device available |
| Pop-up menu | Contextual functions on selected data |
| Progress indicator | Ongoing process status |
| Prompt | Enter command (keyboard input) |
| Push button | Execute immediate command/action |
| Radio button | ONE of many (≤10 static, non-numeric) |
| Read only field | Display data, NOT editable |
| Scroll bar | List exceeds visible area |
| Scroll handle | Pointer available, within scroll bar |
| Selection cursor | Keyboard available, for selection |
| Selection indication | Visual cue for selected element |
| Selection list | Single/multiple selection, 3+ items |
| Status information | Describe a status |
| Stepper | Continuous data list, ONE at a time |
| System message | Important system event |
| Tab set | Limited space, identify each tab |
| Table | Multiple info per object, large data |
| Text field | Character-based data input |
| Time picker | ONE specific time to identify |
| Title | Window uses full screen |
| Toggle button | Property is true/false (2 states) |
| Tool bar | Frequent actions, limited set |
| Tool tip | NO visible label, needs description |
| Window | Graphical UI, applications in windows |

## Relationship with Other ISO Standards!

| Standard | Relationship to ISO 9241-161 |
|---|---|
| ISO 9241-143:2012 | Forms (source for many element definitions) |
| ISO 9241-171:2008 | Software accessibility (required conformance) |
| ISO 9241-110:2006 | Dialogue principles |
| ISO 9241-151:2008 | Web user interfaces |
| ISO 8601 | Date/time representation |
| ISO/IEC 20071-11 | Text alternatives to images |
| ISO/IEC 13066 | Platform-specific accessibility APIs |
| ISO 14915-2:2003 | Multimedia user interfaces |
| ISO 11064-5:2008 | Displays and controls (states) |

## Checklist for ISO 9241-161:2016 Compliance!

### Accessibility!
□ ALL visual UI elements provide alternative text for accessibility
□ Software uses platform accessibility services (cooperates with assistive technologies)
□ Conformity with ISO 9241-171 (every applicable requirement/recommendation met)

### Element Selection!
□ Each element selected based on "When to use" criteria
□ Alternatives considered when conditions NOT met
□ Platform-specific guidelines observed (if any)

### Accordion!
□ Static set of panes, limited space
□ Collapsed/expanded states clearly distinguishable
□ Interaction to expand = interaction to close
□ Visualized in way depicting shared association

### Analogue Form (Slider)!
□ Continuous range input ONLY
□ Active/deactivated states clearly distinguishable
□ Means to change data bi-directionally provided
□ Current value output visualized

### Carousel!
□ Homogenous data elements (same semantic type)
□ Visual data (not alphanumeric) used
□ Means to change focused element provided
□ Contextual information provided (size of data set, current focus)
□ Data organized in logical order

### Check Box!
□ Mutually independent choices (selecting one does NOT affect others)
□ Shared association depicted (grouping OR law of proximity)
□ Indicator visualization consistent (always "x" OR always "✓")
□ States: selected, conditionally selected, unselected ONLY
□ States clearly differentiated

### Colour Picker!
□ Large number of colours (>16)
□ Complex colour settings available
□ Alternative picking methods available (pointer OR RGB data)
□ Previously selected colours/palettes provided

### Combo Box!
□ Mutually exclusive choices, limited space
□ 5+ items OR number may change
□ Users may type entry more quickly than select
□ Data presented in persistent sorted order
□ List collapsed/expanded states

### Cursor!
□ User edits/inputs alphanumeric information
□ Highlights where next interaction will occur
□ Visual indicator clearly distinguishable

### Date Picker!
□ ONE specific date to identify
□ Month + year independently selectable
□ Follows date conventions of local culture
□ Calendar visualizes selected date + adjacent days
□ User can set preferred date format (ISO 8601)

### Dialogue Box!
□ Explicit user decision/action required
□ Affects whole application
□ Presented on topmost visual layer
□ User can hide/dismiss when NOT contextually essential

### Dropdown List!
□ Mutually exclusive, limited space
□ 4+ items OR number may change
□ ALL values supplied by application
□ Displays SINGLE value when inactive
□ Drops down list when activated

### Entry Field!
□ Free text input (NOT predefined choices)
□ Boundaries clearly visualized (contrast, colour, box)
□ Focused/unfocused, active/deactivated, filled/empty states

### Group!
□ MORE than one element in group
□ Visualizes semantic grouping
□ All elements of group depicted with shared association
□ Limited space OR many UI elements needing structuring

### Handle!
□ Pointer device available
□ Properties changed in linear way
□ Clearly differentiated from element being manipulated
□ Alternative means to manipulate properties provided

### Hierarchical List!
□ Inherent hierarchical data structure
□ Homogenous data elements
□ Visual data (not alphanumeric)
□ Contextual information provided (size of data set, current focus)
□ Data organized in logical order

### Implicit Designator!
□ Keyboard is available input method
□ Detectable + distinctive from UI element
□ Explicit key mapping
□ Consistent access within interactive system

### Instructive Information!
□ Additional guidance needed
□ Available for assistive technologies
□ NOT used as alternative to good UI design
□ Previously selected colours/palettes provided

### Input Tokenizer!
□ Link to complex set of data required
□ Clearly identifies its nature
□ NOT editable once turned into token

### Label!
□ Short + concise
□ Supports legibility + readability
□ Clearly depicts role as label (distinct from other text)
□ Invisible labels accessible to assistive tech

### Legend!
□ Presents information for ALL visualized data
□ Invisible legends accessible to assistive tech

### Link/Hyperlink!
□ Clearly differentiated from regular text/other UI elements
□ Dedicated text colour + underlined text/font
□ May be activated by system (time, condition)
□ Further info: ISO 14915-2, Clause 8

### List Box!
□ 3+ items visible simultaneously without scrolling
□ Boundaries clearly visualized
□ Single OR multiple selection as appropriate
□ States of items: focused, selected/unselected

### Menu!
□ Functions + segments grouped by context
□ Cascading presentation available (secondary options)
□ Implements conventions (File, Edit, View, Help)
□ Offers contextual help (tool tip, text)

### Output Pane!
□ Clearly depicts non-editable nature of displayed data
□ Visible/invisible states

### Pointer!
□ Clearly detectable + distinguishable from other UI elements
□ System provides means to individualize pointer speed
□ Visualizes interaction modes (draw, drag, resize)

### Pop-up Menu!
□ Contextual functions on highlighted/selected data
□ Clearly differentiated from underlying UI/data
□ Contextual functions accessible by other means

### Progress Indicator!
□ NOT mistaken for a Slider
□ Visualizes status of operation/process

### Push Button!
□ Short + concise label
□ Activated by SINGLE event (NOT double click)
□ Pressed/not pressed states clearly distinguishable

### Radio Button!
□ Mutually exclusive (ONE selected at any time)
□ Shared association depicted (grouping OR law of proximity)
□ Indicator visualization consistent (always "•" OR always "○")
□ States: selected, conditionally selected, unselected ONLY
□ Static number of options (≤10, non-numeric)
□ ALL options need to be considered at once

### Read Only Field!
□ Can take focus (for assistive tech)
□ Clearly depicts read-only nature
□ Visible/invisible, filled/empty states

### Scroll Bar!
□ Available when corresponding list gets focus
□ Position represents position of visible content
□ Handle size relative to view's current size

### Selection Cursor/Indication!
□ Detectable + distinctive from UI element
□ Explicit key mapping
□ Clearly identifies relation to functional element
□ Consistent access within interactive system

### Selection List!
□ ONLY presents selectable data
□ Persistent sorted order
□ Single OR multiple selection as appropriate
□ 3+ items visible simultaneously without scrolling

### Status Information!
□ References context of use
□ Visible/invisible states

### Stepper!
□ Continuous data list
□ ONE at a time selection
□ Entry field used if >10 available data
□ User can set preferred format (ISO 8601)

### System Message!
□ Conveys if user must take action
□ Presents available actions (if required)
□ Clearly differentiated from other content/data/UI elements
□ User can hide/dismiss when NOT contextually essential

### Tab Set!
□ Tabs depict shared association
□ Active tab clearly indicated
□ Minimized number of tab rows
□ Tabbed dialogue does NOT contain another tab set

### Table!
□ Row/column labels clearly differentiated from data
□ Navigable with arrow keys (if keyboard available)
□ Enables assistive tech access to data

### Text Field!
□ Boundaries clearly visualized (contrast, colour, box)
□ Focused/unfocused, active/deactivated, filled/empty states

### Time Picker!
□ ONE specific time to identify
□ Follows time conventions of local culture
□ User can set preferred time format (ISO 8601: 24h vs. 12h)

### Title!
□ Clearly differentiated from other UI elements
□ Invisible titles accessible to assistive tech
□ Consistent access within interactive system

### Toggle Button!
□ Depicts relation of all elements
□ Visualization of two states consistent
□ Clearly differentiates the states
□ Consistent representation within design solution

### Tool Bar!
□ Frequent actions, limited set
□ Means to hide/remove tool palette
□ User can choose where to position tool bar

### Tool Tip!
□ Does NOT obstruct respective UI element
□ Available for assistive technologies
□ Consistent access within application

### Window!
□ Clicking moves to topmost layer + becomes active
□ Visualized to indicate active/inactive
□ Title, canvas, frame, minimize/maximize/close controls

## Key Design Considerations!

1. **Accessibility FIRST** - ALL elements must provide alternative text, conform to ISO 9241-171`
2. **Input independence** - ALL elements operable by ALL available input methods (keyboard, pointer, touch, voice)`
3. **States must be distinguishable** - Each state visually clearly different from ALL other states`
4. **Consistent visualization** - Same element type = consistent appearance + behavior throughout application`
5. **When to use** - Follow decision criteria (conditions) for each element type`
6. **Semantic grouping** - Related elements grouped (law of proximity, visual grouping)`
7. **Platform awareness** - Respect platform-specific guidelines (may constrain location/use)`
8. **Alternative text** - Required for ALL elements (ISO/IEC 20071-11 for images)`
9. **Keyboard support** - Implicit designators, selection cursors for keyboard users`
10. **Visual clarity** - Clear boundaries, labels short/concise, legible/readable`
