---
name: iso-9241-151
description: "Guidance on World Wide Web user interfaces. Use when designing websites, web applications, navigation structures, or web content presentation. Triggers: web user interface, website design, web navigation, web content, web accessibility, ISO 9241-151, WCAG, web usability, site map, navigation structure, search functions."
---

# ISO 9241-151:2008 - Guidance on World Wide Web User Interfaces

Follow ISO 9241-151:2008 for ergonomic design of World Wide Web (WWW or Web) user interfaces.

## Scope!

**Applies to**:`
- High-level design decisions and design strategy`
- Content design`
- Navigation and search`
- Content presentation`

**NOT covered**:`
- User interfaces of different types of user agents (Web browsers) or additional tools (Web authoring tools)`
- Technical implementation of recommendations`
- Aesthetic or artistic design`

**Intended for**:`
- Developers/designers of Web user interfaces`
- Content providers (generate/maintain content)`
- Developers of content authoring tools`
- Usability evaluators`
- Buyers (ensure ergonomic quality)`

## Reference Model (Clause 5, Figure 1)!

Web user interface design structured in 5 major areas/levels:**
1. **High-level design aspects** (Clause 6)`
2. **Conceptual content model** (Clause 7.1)`
3. **Content objects and functionality** (Clause 7.2)`
4. **Navigation and search** (Clause 8)`
5. **Content presentation** (Clause 9)`

**Note**: Higher-level issues should USUALLY be addressed before lower-level design decisions.`

**Also consult**:`
- **Process domain**: Human-centred design process (ISO 13407)`
- **Evaluation domain**: Usability evaluation methods (ISO 9241-11, ISO/TR 16982, ISO/TR 18529)`

## Clause 6: High-Level Design Decisions!

### 6.1 General Aspects`
Websites range from conventional (collections of interlinked pages) to specialized Web services (accessed through specific devices).`

**Design style**: Explicitly stated + discussed among stakeholders.`

**Key considerations**:`
- Purpose of Web application (public info, e-commerce, intranet, adaptive services)`
- Target user groups (diverse knowledge, capabilities, languages)`
- User goals (may conflict with provider goals, e.g., advertising vs. efficient info access)`
- Design goals prioritization (fun, credibility, engagement vs. efficiency)`
- ICT accessibility (ISO 9241-20)`
- Software accessibility (ISO 9241-171)`
- Web content accessibility (WCAG 1.0, superseded by WCAG 2.0 when published)`

### 6.2 Determining Purpose of Web Application`
Purpose should be explicitly defined to provide clear basis for content/functionality + determine design objectives.`

**Example**: Online shopping website recognizable by title, description, graphical design of home page. How it differs from competitors.`

### 6.3 Analysing Target User Groups`
Target user groups should be identified in process of defining purpose.`

**Consult**: ISO 9241-2 and ISO 9241-11 for guidance on considering users/tasks.`

### 6.4 Analysing Users' Goals and Tasks`
Goals and tasks of intended users should be analysed.`

### 6.5 Matching Application Purpose and User Goals`
Purpose should be matched with users' goals. If conflicts exist (e.g., advertising vs. efficient info access), design so users NOT negatively affected.`

### 6.6 Recognizing Purpose of Web Application`
Intended purposes should be easily recognized by user.`

**Example**: Short descriptive sentence (tagline) on e-commerce site conveys company purpose.`

### 6.7 Prioritizing Design Goals`
Different competing design goals should be prioritized wrt. most likely frequent/critical tasks + needs of users.`

### 6.8 ICT Accessibility`
ISO 9241-20 shall be consulted for guidance on ICT accessibility. Web user interfaces should meet its requirements/recommendations.`

### 6.9 Software Accessibility`
ISO 9241-171 shall be consulted for guidance on software accessibility. Web user interfaces should meet its requirements/recommendations.`

### 6.10 Web Content Accessibility`
WCAG 1.0 and superseding WCAG 2.0 shall be consulted for guidance on web content accessibility.`

### 6.11 Identifying Website and Owner`
Identity of website + website owner should be presented clearly/accurately on ALL relevant pages.`

**Include**: Company/business entity info, contact channels (address, e-mail, fax, phone, messenger, etc.).`

**Note**: Adding suitable metadata = additional means for making website identifiable.`

### 6.12 Coherent Multi-Site Strategy`
If info/services distributed over different websites/subsites: coherent strategy should be developed for consistent navigation + locate relevant info/services WITHOUT prior knowledge.`

**Note**: Style guide might assist designer/developer in multi-site situations.`

## Clause 7: Content Design!

### 7.1 Conceptual Content Model`

**7.1.1 General**: Conceptual model describing concepts/relations of application domain = important basis for defining content + navigation structure.`

**Developed by**: Analysing tasks/mental models of prospective users + existing info structures (taxonomies).`

**Example**: Online shop - red wines from Bordeaux are subcategory of red wines, which are subcategory of wine. Due to popularity, Bordeaux wines shown at top level.`

**Methods**: Card sorting, affinity diagrams, modelling techniques (UML, topic maps).`

**Conveyed through**: Appropriate metaphors (e.g., newspaper layout indicates article importance).`

**7.1.2 Designing Conceptual Model**: Should be based on tasks/mental models of expected users/user groups, using suitable task analysis techniques.`

**7.1.3 Appropriateness of Content**: Content should be suitable for purpose of Web application + target audience (characterized by goals, knowledge, preferences).`

**Example**: Company website provides overview of competencies/products for prospective customers. Intranet focuses on internal processes + knowledge exchange among employees.`

**7.1.4 Completeness of Content**: Content should be sufficiently complete wrt. purpose of site + typical information needs of user.`

**7.1.5 Structuring Content Appropriately**: Content should be structured based on user's tasks/information needs + mental model.`

**Example**: Online newspaper - brief summaries at top level with links to detailed articles. Decomposition into summary/detail allows quick selection of interesting items.`

**7.1.6 Level of Granularity**: Units of content should have appropriate level of granularity (level of detail), especially if reused for different purposes.`

**Example**: News article = short headline, abstract several lines long, or multi-page in-depth description.`

### 7.2 Content Objects and Functionality`

**7.2.1 General**: Based on conceptual model, concrete content objects developed (text, images, animations, other media types). Can be non-interactive (provides info) or interactive (allows input/functionality).`

**7.2.2 Independence of Content, Structure, Presentation**: Helps improve accessibility.`

**Example**: Using HTML tables to control layout = difficult to navigate/understand on cell phone or presented with screen reader.`

**Techniques**:`
- Cascading Style Sheets (CSS)`
- Semantic markup (XML + XSL or CSS)`
- Functions provided by content management system`

**7.2.3 Selecting Suitable Media**

**7.2.3.1 Selecting Appropriate Media Objects**: Media objects should be selected based on:`
- Type of content to be presented`
- User's tasks`
- Communication goal to be achieved`

**Example**: Video for illustrating continuous action (skiing) to convey essential movement aspects.`

**Note**: Using dynamic media just to attract attention can overload user's perception.`

**7.2.3.2 Providing Text Equivalents**: ALL non-text media objects (images, video) should be provided with alternative equivalent textual descriptions/functionality.`

**Benefits**: Facilitates use on devices with small screens, text indexing/searching, auditory presentation, critical for accessibility.`

**7.2.3.3 Enabling Control of Time-Dependent Media**: Users should be provided with functions to pause/stop presentation of time-dependent media (animations, moving text).`

**7.2.4 Keeping Content Up-to-Date**: No out-of-date content should be shown when validity/relevance is time-dependent. Users expect content to be up-to-date.`

**Example**: Weather forecast updated at least daily. Useful to provide quick access to recently featured info (last 2 weeks/month) via history.`

**7.2.5 Making Date/Time of Last Update Available**: Date/time of last update should be available for all Web pages/content objects (if important for user's task). Can be displayed permanently or on demand.`

**7.2.6 Enabling Communication with Website Owner**: Means of communicating with website owner should be provided (request info, resolve problems).`

**Example**: E-mail, postal address, phone number + contact person on "contact us" page. Inform users when to expect reply.`

**7.2.7 Accepting Online User Feedback**: Users should be provided with online feedback mechanism for sending comments/questions/ratings related to content/products.`

### 7.2.8 Privacy and Business Policies**

**7.2.8.1 Providing Privacy Policy**: If website requires personal info entry, explicit/easy-to-understand privacy policy should be provided (where info gathered, how used, with whom shared).`

**Note**: Some countries have specific legislation. Advisable to provide in standardized format (W3C's P3P).`

**7.2.8.2 Providing Business Policy**: If relevant, business policy statement should be readily available.`

**7.2.8.3 User Control of Personal Info**: If personal info entered, users should be provided with mechanisms for specifying whether/how personal info is used. Preferable to require "opt-in" rather than "opt-out". Allow view/change/revoke consent at any time.`

**7.2.8.4 Storing Info on User's Machine**: If Web application stores data/executables on user's local machine (cookies), policy for using that data should be explicit + discriminable from privacy policy.`

### 7.2.9 Individualization and User Adaptation**

**7.2.9.1 General**: Adapting content/navigation to individual users/groups = useful mechanism for providing interesting info + making access to relevant info easier.`

**Approaches**:`
- Users specify preferences themselves (individualization)`
- System selects profile based on criteria (predefined user profiles)`
- Monitoring user behaviour + adapting to inferred goals (automatic adaptation)`
- Recommending relevant info based on behaviour of all users/user group`

**7.2.9.2 Taking Account of Users' Tasks**: When providing different access paths/navigation structures for different user groups, tasks/info needs should be considered.`

**Example**: Intranet - financial dept. sees currency exchange rates directly on home page; developers see links to technical news.`

**7.2.9.3 Making Individualization/Adaptation Evident**: It should be made evident when individualization/adaptation are used.`

**7.2.9.4 Making User Profiles Evident**: If predefined/user-specified profiles used for individualizing/adapting, profile currently used should be made evident.`

**7.2.9.5 Allowing Users to See/Change Profiles**: If user-specified profiles used, users should be able to see/modify/delete profile on demand (delete info completely).`

**7.2.9.6 Informing About Automatically Generated Profiles**: If user profiles automatically generated to adapt interface, it should be made evident what info is used + how it affects using Web user interface.`

**Example**: News website generates profile based on navigation actions to recommend topics of interest. User informed recommendations based on previous interest.`

**7.2.9.7 Switching Off Automatic Adaptation**: If Web user interface automatically adapted (profiles, behaviour monitoring), users should be able to explicitly switch off automatic adaptation or switch to another profile.`

**Note**: Automatic adaptation may be confusing if users have to use different navigation path. Design with care, taking into account mental model + other factors.`

**7.2.9.8 Providing Access to Complete Content**: If user-specific/profile-based navigation used, users should be able to explore complete content of website (if authorized).`

## Clause 8: Navigation and Search!

### 8.1 General`
Navigation involves activities to move from current to desired content (Web navigation). Search offers direct access (without multiple navigation steps). Often used in combination.`

**Note**: Navigation actions can be triggered by system (e.g., splash screen auto-closed after certain time).`

**Consult**: ISO 14915-2 for mapping content onto presentation segments + designing navigation structures.`

### 8.2 General Guidance on Navigation`

**8.2.1 Making Navigation Self-Descriptive**: Navigation should help users understand where they are, where they've been, where they can go next.`

**Consult**: ISO 9241-110 for self-descriptiveness guidance.`

**8.2.2 Showing Users Where They Are**: Each presentation segment (page/window) should provide clear indication of position in navigation structure + current segment position wrt. overall structure.`

**Example**: User moved through 3 levels in product catalogue. Current page has heading showing position.`

**8.2.3 Supporting Different Navigation Behaviours**: Users exhibit different navigation behaviours (goal-driven, heuristic, mental map, etc.). Different user goals/navigation strategies should be considered.`

**Navigation behaviours**:`
- **Goal-driven**: Decide rationally about next link, remember path, backtrack. Supported by: efficient navigation paths, task-related links, history, backtracking.`
- **Heuristic**: Avoid planning/memorization, navigate based on currently visible info/links. Implication: pages comprehensible as individual units, links clearly describe target.`
- **Mental map**: Infer navigation structure + use map to access content. Supported by: well-organized navigation structure + overview techniques (site maps).`
- **Other**: Memorization of frequent paths, cost-benefit trading off navigation effort vs. expected value.`

**8.2.4 Offering Alternative Access Paths**: Alternative paths to specific content unit should be offered to support different user strategies.`

**Example**: Page with export regulations can be accessed through content-based category "export regulations" OR step-by-step procedure for shipping product.`

**8.2.5 Minimizing Navigation Effort**: Number of navigation steps to reach certain content should be minimized (taking into account different mental models, navigation strategies, tasks).`

**Note**: Less effort expended when user makes confident choices (specific, match expectations) rather than vague/confusing choices.`

### 8.3 Navigation Structure`

**8.3.1 General**: Navigation structure determines ALL potential paths users can move around Web user interface. For given content structure, different navigation structures can be designed.`

**Consult**: ISO 14915-2 for designing navigation structures.`

**8.3.2 Choosing Suitable Navigation Structures**: Should be designed based on conceptual content model + user tasks/navigation strategies. Typically: hierarchies, networks, sequences of presentation segments, or combinations.`

**Example 1**: Website explored based on hierarchical decomposition of topics. Important/new info presented at top level although belongs to lower levels.`

**Example 2**: E-commerce site offers menu based on product categories (shoes) + menu based on user activity (hiking).`

**8.3.3 Breadth vs. Depth**: For complex navigation, broad structures (larger number of links on one page) preferred over deep ones (large number of navigation steps), provided links are logically grouped, meaningfully labelled, number doesn't exceed perceptual capabilities.`

**Consult**: ISO 9241-14 for breadth vs. depth in menus.`

**8.3.4 Organizing Navigation Meaningfully**: Navigation structure should be organized based on meaningful concepts relevant to user. Includes: content-based, task-based, frequency-based, etc.`

**Example 1**: E-commerce site offers content-based navigation mapping product classification to catalogue with clearly labelled product category names.`

**Example 2**: Web-based business application offers navigation menu based on different user tasks (enter new order, change customer data, cancel order).`

**Example 3**: Intranet - relevant documents linked with single steps of procurement procedure. Users can navigate to documents from each step + additional content-based access.`

**Example 4**: Online shop - users can navigate to frequently purchased items from list on homepage.`

**8.3.5 Offering Task-Based Navigation**: For well-defined user tasks (purchasing product), navigation structure should offer clearly identifiable links to pages related to task + guide through sequence of pages for multi-step tasks.`

**Frequent tasks**: Supported by "quick links" on homepage. Within task, users guided from step-to-step with appropriate options (Back/Next) separate from browser back button. Important to give clear indication of current position in task + appropriate data processing feedback.`

**8.3.6 Offering Clear Navigation Within Multi-Step Tasks**: If users navigate between different pages (presentation segments) belonging to same multi-step task, should be supported by:`
- Step-by-step instructions`
- Clear indications of user's position at all times`
- Allowing users to move to previous steps + correct entries`
- Feedback on status of data processing`

**Note**: Support for navigation between task steps critical for BOTH usability + accessibility.`

**8.3.7 Combining Different Ways of Organizing Navigation**: When more than one navigation path available (task-based + topic-based access), structures should be designed to support different user goals + easy to understand.`

**Example**: Customer relationship management system - customers + orders found by navigating between customer groups + browsing in customer lists. Orders accessible from page displaying respective customer's data. Direct "change customer data" or "new order" links on homepage.`

**8.3.8 Informative Home Page**: Home page represents top-level node in navigation structure. Should provide sufficiently self-contained info so user can understand purpose + anticipate content of site, show important/new content, provide access to ALL relevant navigation substructures.`

**Example**: E-commerce site home page shows purpose + current special offers + groups of links to catalogue (complex substructure), viewing/changing customer account info, joining discussion forum, other relevant areas.`

**Note**: Rich info content preferable to "empty" home pages showing only few links (provided user's perceptual capabilities NOT overloaded). Overloading avoided by organizing content into groups + suitable layout.`

**8.3.9 Directly Accessing Relevant Info from Home Page**: Home page should provide direct access to particularly relevant/frequently used info/functionality (provided user's perceptual capabilities NOT overloaded).`

**8.3.10 Splash Screens**

**8.3.10.1 Avoiding Unnecessary Splash Screens**: Splash screens should be avoided unless provide useful content/feedback about application state.`

**8.3.10.2 Skipping Splash Screens**: If splash screen used, navigation option to skip it should be offered (standard HTML link, NOT part of flash animation).`

**8.3.11 Avoiding Opening Unnecessary Windows**: Additional windows (new browser/pop-up) should only be opened if supports user's task.`

**Reasons to avoid**: Can distract/confuse/impede users, superimpose primary window (hiding relevant info), cognitively difficult to understand navigation structure, require additional actions to close, problematic for non-visual/non-standard user agents.`

**When useful**: Subtask tangential to primary task (select date) OR when info in pop-up window needs to be used in conjunction with main window (help content).`

### 8.4 Navigation Components`

**8.4.1 General**: Navigation components = groups of navigation elements (menus, tabs, trails "breadcrumbs") showing path from top node to current position. Help users:`
- Gain overview of navigation structure`
- Get idea of where to go next`
- Obtain direct access to relevant nodes ("landmarks")`
- Proceed through different steps of complex task`
- Facilitate moving from one task to another (especially if typically done in sequence)`
- Go back to previously visited nodes`

**8.4.2 Providing Navigation Overviews**: Website should normally provide overviews of navigation structure (can be removed/simplified if user focussed on specific task, e.g., e-commerce check-out).`

**Example 1**: Permanently visible, expandable navigation menu on left side of window.`

**Example 2**: Process requiring sequence of steps (buying product) - overview shows steps needed to complete transaction.`

**Note**: Expandable navigation menus inconvenient when total links (even if hidden) is high. For large number of links, labelled navigation scheme preferred.`

**8.4.3 Maintaining Visibility of Navigation Links**: Main navigation links should either be permanently visible OR easy for user to make them visible if scrolled out of view.`

**Example**: On long page needing scrolling, links provided after each section for going directly to top/bottom.`

**8.4.4 Consistency Between Navigation Components and Content**: If navigation components shown in conjunction with associated content, consistency between component + content shown should be maintained (indicate in navigation component which topic currently visible).`

**8.4.5 Placing Navigation Components Consistently**: Navigation components should be placed consistently on pages/framesets of website.`

**8.4.6 Making Several Levels of Navigation Visible**: If navigation structure has several levels, component should be designed to show more than one level at same time.`

**Example**: Hierarchically expanding menu for accessing content. Seeing several levels supports understanding navigation structure + accessing desired content more quickly (provided NOT cognitively/perceptually overloaded).`

**8.4.7 Splitting Up Navigation Overviews**: For deeply nested structures, navigation overviews may be split into several independent components shown in different parts of page/browser window. Partitioning should be semantically meaningful + placement consistent throughout website.`

**Note**: Critical that users NOT be perceptually/cognitively overloaded by splitting into too many components.`

**8.4.8 Providing Site Map**: Separate navigation overview (site map) should be provided for websites showing structure in overview form.`

**Note**: For small websites (one level of navigation), site map NOT needed.`

**8.4.9 Providing Cross Linking to Potentially Relevant Content**: Cross links to potentially relevant pages in navigation structure should be provided (without overloading user with too many links).`

**Example**: In addition to navigation overview, links within content part of page pointing to related information.`

**8.4.10 Making Dynamic Navigation Links Obvious**: Users should be enabled to distinguish dynamically created navigation links from permanent links.`

**Example**: List of products in navigation overview - links created dynamically from database can change from visit to another. Made clear by organizing product links in coherent submenu.`

**8.4.11 Linking Back to Home Page or Landmark Pages**: Each page should contain link leading to home page or to landmark page that is easy to recognize.`

**8.4.12 Going Back to Higher Levels**: For multi-level navigation structures in complex websites, each page should show links to higher levels (apparent to user how to return to those levels). For deeply nested structures, only subset of superordinate levels may need to be shown.`

**8.4.13 Providing "Step Back" Function**: If task requires sequence of steps, meaningful "step back" function should be provided on page (use "Back" button in wizard guiding through steps - standard browser functionality would cause data loss).`

**8.4.14 Subdividing Long Pages**: If pages are long, should be subdivided into meaningful sections (directly accessible by within-page links on top of page). For large amounts of content: splitting into several pages OR dividing into sections with headers. Suitable metadata = additional means of producing identifiable sections.`

**8.4.15 Explicit Activation**: Navigation steps requiring selection of setting/option should be explicitly activated by user in consistent manner (unless evident selection triggers navigation).`

**Example 1**: Before accessing website content, users need to select language from drop-down. Navigation only activated after clicking additional link/button.`

**Example 2**: Submit button consistently used to confirm option selection (from drop-down list) before going to new page.`

**Note**: Users could confuse selection of option with activation of navigation step.`

**8.4.16 Avoiding "Dead Links"**: Links not leading to existing target ("dead links") should be avoided (especially if target on same website under designer/operator control).`

**8.4.17 Avoiding Incorrect Links**: Links not leading to intended target or not functional should be avoided (particularly when modifications made to website).`

### 8.5 Search**

**8.5.1 General**: Providing search mechanisms = important technique for making user's access to required info more effective. If specific terms known, users may prefer searching to navigating. Search mechanisms particularly important for large sites that cannot be explored with acceptable effort.`

**8.5.2 Search Function**

**8.5.2.1 Providing Search Function**: Search function should be provided (unless Web user interface can be explored exhaustively with acceptable effort).`

**8.5.2.2 Providing Appropriate Search Functions**: Search functions should be appropriate for user's goals/experience. Can vary considerably (Boolean search vs. keyword search) + resulting complexity/cognitive demands. Consider prior experience with search functions. When different levels of user experience/goals expected: provide several search functions with different characteristics/complexity.`

**8.5.2.3 Providing Simple Search Function**: Simple search function should be provided.`

**8.5.2.4 Advanced Search**: If suitable for task, advanced search functions should be provided in addition to simple search (with sufficient descriptive info/help for using those features). Typically allow specifying more precisely how search works (Boolean operators, setting scope).`

**8.5.2.5 Full Text Search**: When searching for text on large websites, full text search functions should be offered.`

**8.5.2.6 Describing Search Technique Used**: If relevant for user's task, system should provide sufficient info concerning search technique for user to formulate queries correctly.`

**8.5.2.7 Availability of Search**: Search function should be available from ALL pages of website (unless current context/task doesn't allow/require searching).`

**Example**: On e-commerce site, all pages either directly show search area OR link leading to search page (except pages user has to sequentially step through to buy product).`

**8.5.2.8 Search Field Size**: Field for entering query should be sufficiently large to entirely display typical query.`

**8.5.2.9 Shortcut to Search Function**: If main entry on page is one or more search fields, shortcut for activating search by default activation key (typically Enter key) should be provided.`

**8.5.2.10 Error-Tolerant Search**: Search function should return useful results in spite of imprecise/incorrect terms entered in query.`

**Example**: When misspelled word entered, system presents results for incorrect term AS WELL AS suggestion to search again with corrected term.`

**8.5.3 Search Results**

**8.5.3.1 Ordering Search Results**: Search results should be ordered in meaningful way for user + correspond to his/her information needs.`

**Example 1**: Document retrieval application - documents found ordered by relevance to search.`

**Example 2**: News feed system - search results ordered by time/date.`

**8.5.3.2 Relevance-Based Ranking**: If results ordered according to pre-defined internal ranking mechanisms, users should be provided with sufficient info for understanding effect of this ranking wrt. their tasks/information needs.`

**8.5.3.3 Descriptiveness of Results**: Search results should be described in sufficient detail for user to understand relevance. If different levels of details available, user may be given option to select level of detail/components shown.`

**8.5.3.4 Sorting/Filtering Search Results**: If appropriate to task, users should be given option to sort/filter search results by different criteria. Most flexible = allow users to re-sort results after they've been produced. If search complex/time-consuming, specifying sorting criteria in advance = acceptable alternative.`

**8.5.4 Using Search Functions**

**8.5.4.1 Scope of Search**: If different scopes for performing search are applied, scope used should be made explicit.`

**Example**: Company site - search normally operates on complete info contained in site. Pro search limited to products only - indicated by labelling link activating search.`

**8.5.4.2 Selecting Scope of Search**: If appropriate to task, selecting scope of search should be possible.`

**8.5.4.3 Providing Feedback on Volume of Search Result**: Users should be provided with feedback on number of results found. Often helpful to allow users to specify number of results shown on single page.`

**8.5.4.4 Handling Large Result Sets**: Consistent technique for handling large result sets should be used for all pages showing search results.`

**Example**: Search results broken up into equal pages + user given means to navigate between pages. May be necessary to limit number of results shown to user at one time (avoid reading problems due to scrolling, OR technical limitations).`

**8.5.4.5 Showing Query with Results**: On results page, query entered should be shown. Allows users to check query against results obtained + detect errors/problems in formulated query.`

**8.5.5 Repeating and Refining Searches**

**8.5.5.1 Giving Advice for Unsuccessful Searches**: If no results obtained based on query entered, search tips should be provided for specifying queries more effectively.`

**Example**: Boolean search for "cat" AND "dog" returns no results - meaning of query explained + alternative query using OR suggested.`

**8.5.5.2 Repeating Searches**: Page showing search results should contain option to search again with changed query on same page (unless search requires specific search page).`

**Example**: Search returns no results - search field shown again in conjunction with appropriate message. Allows users to immediately repeat search with new/modified query. Providing search history = useful technique for keeping track of what already done.`

**8.5.5.3 Refining Searches**: If volume of search results is large, users should be provided with mechanism for refining their search within result set obtained by first query.`

**Example**: Search resulting in large number of items accompanied with "search within results" option.`

## Clause 9: Content Presentation!

### 9.1 General`
Provides guidance on presentation of content in Web user interface. Developing content objects independent of their presentation (see Clause 7) recommended - many aspects of content presentation can be specified separately (e.g., style sheets).`

**Consult**:`
- ISO 9241-12 (general presentation issues)`
- ISO 9241-13 (user guidance)`
- ISO 14915-1 to 14915-3 (multimedia user interfaces)`

### 9.2 Observing Principles of Human Perception`
When designing Web pages, general principles of human perception should be taken into account.`

**Consult**:`
- ISO 9241-303 (electronic visual displays)`
- ISO 9241-17 (form-based dialogues)`
- ISO 14915-2 (multimedia interfaces)`
- ISO 9241-171 (software accessibility)`

### 9.3 Page Design Issues**

**9.3.1 General Page Information**: Every page should display descriptive title + (if relevant) ownership + last update.`

**9.3.2 Consistent Page Layout**: Pages should be designed using consistent layout schemes, supporting user in finding similar information at same position on different pages.`

**Note**: Overall layout schemes apply to ALL Web pages (preferable when all pages have similar structure). When pages have different purposes/types of content: pages can usually be grouped in different categories, using one layout scheme for each category consistently.`

**9.3.3 Placing Title Information Consistently**: Page titles should be placed in consistent location on different pages.`

**9.3.4 Recognising New Content**: Appropriate means should be used for drawing user's attention to new/significantly changed content (if relevant to user's task). Select techniques that have NO distracting/detrimental effect.`

**Consult**: ISO 14915-3 and ISO 9241-171.`

**9.3.5 Visualizing Temporal Status**: If content of page only valid for certain period of time, period of validity should be indicated by appropriate means.`

**9.3.6 Selecting Appropriate Page Lengths**: Length of page should be selected to support primary purpose/use of page.`
- Short pages: more appropriate for homepages, navigation pages, overview pages (need to be read quickly)`
- Longer pages: appropriate when users want to read content without interruptions OR page needs to match paper counterpart`

**9.3.7 Minimizing Vertical Scrolling**: Vertical scrolling should be minimized. Can be done by placing important info at top + providing links to info further down page.`

**9.3.8 Avoiding Horizontal Scrolling**: Horizontal scrolling should be avoided wherever possible.`

**Note**: Need for horizontal scrolling can be caused by images/tables wider than window width.`

**9.3.9 Using Colour**: Colour should be used with care, taking into account human capabilities/restrictions in perceiving colour + NOT as only means of conveying information.`

**Example**: Error messages displayed with red text also shown in bold face.`

**Consult**: ISO 9241-303 for guidance on using colour.`

**Design considerations**:`
- Limit number of colours for coding purposes to NOT more than 10, preferably NOT more than 5`
- Maintain sufficient foreground-background contrast`
- Avoid certain foreground-background colour combinations that impede reading text (e.g., red text on blue background)`
- Colour should NEVER be only means of coding (some users have difficulties perceiving certain colours/colour combinations - colour-blindness). Make colour auxiliary coding + redundant with other techniques.`

**Consult**: ISO 9241-12:1998, 7.5.`

**9.3.10 Using Frames with Care**: If frames used, care should be taken to avoid possible problems (affecting use of back button, bookmarking pages, scrolling info).`

**Important**: Title each frame + describe its purpose + how frames relate to one another (using appropriate HTML markup). Facilitates frame identification + navigation for persons using small screens/screen readers.`

**9.3.11 Providing Alternatives to Frame-Based Presentation**: If frames used on website, alternative way of presenting relevant info without frames should be provided.`

**Example**: Floating elements (CSS 2.1) used to show permanently visible navigation component.`

**Note**: Some user agents (cell-phone browsers) might NOT be able to present frames.`

**9.3.12 Providing Alternative Text-Only Pages**: When style sheets and/or frames are turned off, should be possible for user to read/understand Web page; alternatively, user should be provided with equivalent alternative text-only page.`

**9.3.13 Consistency Across Related Websites**: If organization maintains several websites addressing same audience, overall design should be consistent + different parts easy to access.`

**Example**: Coherent navigation + page design for different business units within company.`

**9.3.14 Using Appropriate Techniques for Defining Layout**: Layout of page should be defined using appropriate techniques to accommodate varying characteristics of presentation devices/software.`

**Example**: Instead of using HTML table for producing layout of page, CSS (Cascading Style Sheet) used.`

**9.3.15 Identifying ALL Pages of Website**: All pages/windows belonging to specific website should be easily identifiable as parts of that site.`

**Example**: All pages of company site marked with company logo. Logos = effective way to ensure user aware of identity of page they've arrived at.`

**9.3.16 Providing Printable Document Versions**: If document is too long, dispersed over several pages, OR in specific layout NOT suitable for online reading: printer-friendly version should be provided (prints content in acceptable form - expected layout, paper format, orientation).`

**Note**: Printable versions useful for online viewing AND printing. Consider providing coherent printable online page showing document content OR downloadable version of document.`

**9.3.17 Using "White Space"**: "White space" (space filled only with background colour) should be used so it does NOT impair visual skimming of page.`

**Note**: Overloading can be avoided by organizing content into different groups + showing these groups in suitable layout.`

### 9.4 Link Design`

**9.4.1 General**: Links can be presented by different means (text, buttons). Using appropriate technologies, arbitrary multimedia objects (moving objects in animation/film) can also be used as link anchors.`

**Consult**: ISO 14915-2 for general guidance on link design.`

**9.4.2 Identification of Links**: Links should be easily recognisable by user. Supported by variety of techniques (underlining, colour-coding text, highlighting link, positioning link in group of navigation elements).`

**Note**: Links should NOT be recognisable only by their colour (see ISO 9241-12). Also avoid designing visual elements that appear to be links but which are NOT.`

**9.4.3 Distinguishing Adjacent Links**: When several textual links shown in one section of text OR in single line, links should be visually separated from one another (e.g., non-link printable characters).`

**9.4.4 Distinguishing Navigation Links from Transactions**: Interaction objects shown on page should be chosen so users can easily distinguish between navigation (leading to new content) and transactions (manipulating data).`

**Example**: Text links for navigating page-to-page, while buttons for transactions that manipulate data.`

**9.4.5 Self-Explanatory Link Cues**: Link cues (link labels, icons, tool-tips) presented to user should be self-explanatory + give clear indication of target to which link leads.`

**Example 1**: Link labelled "Product Description" leads user from overview list of products to detailed description of product selected.`

**Example 2**: Destination or action of link explained in "title" attribute of anchor tag (tool-tip).`

**Note**: Textual link anchors with clear description of link target are usually best technique. Graphical symbols only useful for common/frequently used link types + if represent well-known metaphor (shopping cart symbol in e-commerce).`

**9.4.6 Using Familiar Terminology for Navigation Links**: Navigation links (particularly representing main navigation structure of website) should be labelled with terms familiar to user, based on:`
- General knowledge`
- Prior experience in application domain`
- Experience using other systems`

**9.4.7 Using Descriptive Link Labels**: Target/purpose of link should be directly indicated by its label, avoiding generic labels such as "go" or "click here" (except where purpose of link is clear from context or labels have commonly understood semantics).`

**Note**: Frequently, list of link parameters (country names) in conjunction with "go" button used to select from large/variable number of link targets. Acceptable if meaning of navigation clearly understandable.`

**9.4.8 Highlighting Previously Visited Links**: If standard browser presentation of links modified/bypassed (e.g., using graphics as links), links that have been previously visited by user should be marked by appropriate technique (colour coding of that link).`

**9.4.9 Marking Links to Special Targets**: Links leading to special targets should be clearly marked:`
- Other file formats (audio, video files)`
- Exceptionally large files with long download times`
- Pages in different languages`

**Example**: Link to large, downloadable file preceded by text indicating file size.`

**9.4.10 Marking Links Opening New Windows**: Links that open new browser windows/pop-up windows should be clearly marked (small arrow before name of link). Suitable text equivalent provided to support mobile devices + accessibility.`

**9.4.11 Distinguishing Navigation Links from Controls**: Navigation links should be clearly distinguishable from controls activating some action.`

**Example**: All links opening new window marked with small arrow before name of link.`

**Typical action types in Web user interfaces**:`
- Manipulating application data`
- Performing searches`
- Communication actions (opening e-mail window, starting chat function)`
- Presentation-related actions (sorting list of search results)`

**9.4.12 Distinguishing Within-Page Links**: Within-page links should be clearly distinguishable from other links leading to different page.`

**Example**: Within-page links shown with dashed rather than solid underlines.`

**9.4.13 Link Length**: Textual link names should be long enough to be understood but short enough to avoid wrapping.`

**Example**: Where line-wrapping cannot be avoided (due to window/frame size), links represented so they can be recognised as single coherent link cue.`

**9.4.14 Redundant Links**: If more than one link pointing to same target provided on page, labels of redundant links should be consistent.`

**9.4.15 Avoiding Link Overload**: Text pages containing large proportions of links should be formatted so presence of links does NOT impede readability of text.`

**Example**: Sentences with sets of links structured using bullet lists.`

**9.4.16 Page Titles as Bookmarks**: Pages should have appropriate titles so they are usable as bookmarks. Titles used for:`
- Bookmarks`
- Window identification`
- Helping user orientation`

### 9.5 Interaction Objects`

**9.5.1 Choosing Appropriate Interaction Objects**: Concrete interaction objects (links, buttons, input fields, check boxes, selection lists) should be chosen based on:`
- Type of input (initiating action, changing setting, starting navigation)`
- Whether possible input values are pre-defined or unconstrained`
- Type of input value (numeric, textual)`
- Number of elements to be selected`

**Consult**: ISO 14915-2 for detailed guidance on selecting + combining media objects.`

**Consider user task characteristics**: Expected frequency of performing input action, frequency of selecting particular value, number of values user needs to see in parallel. Also factors like amount of screen space available.`

### 9.6 Text Design**

**9.6.1 Readability of Text**: Text presented on Web pages should be readable (taking into account expected display characteristics + spatial arrangement).`

**Consult**: ISO 9241-303 for screen text legibility requirements.`

**9.6.2 Supporting Text Skimming**: Fast skimming of text should be supported by:`
- Clear links`
- Bulleted lists`
- Highlighted keywords`
- Logical headings`
- Short phrases + sentences`

**9.6.3 Writing Style**: Reading/understanding of textual content on screen should be supported by suitable means:`
- Short sentences`
- Division of text into shorter chunks`
- Presentation of content items in form of bullet points`

**9.6.4 Text Quality/Readability**: Quality of textual content wrt. spelling/grammar should be sufficient so as NOT to impede readability. Can be achieved by routinely using spell-checking software prior to publishing Web pages.`

**9.6.5 Identifying Language Used**: Primary natural language used on Web page as well as text passages in other languages should be identified by suitable techniques (HTML markup). Enables assistive technologies to determine language of text + render it appropriately.`

**9.6.6 Making Text Resizable by User**: Text should be able to be resized by user (using functions provided by user agent or other appropriate means - see ISO 9241-171).`

## Clause 10: General Design Aspects!

### 10.1 Designing for Cultural Diversity and Multilingual Use`

**10.1.1 General**: If users of Web application expected to be culturally diverse and/or use different native languages, Web user interface should be designed to take relevant characteristics of different user groups into account.`

**Supported by**: Providing localized versions of Web user interface.`

**10.1.2 Showing Relevant Location Information**: If suitable for task, information should be provided about geographical context of website.`

**Example**: User support site of company - full country names shown along with list of phone numbers users expected to call + time zone information to aid in determining appropriate hour of day to call.`

**10.1.3 Identifying Supported Languages**: If website available in different languages, languages supported + links for selecting them should be clearly presented.`

**Advisable**: Identify language using commonly understood names OR (if appropriate) language code according to ISO 639. Use of flags NOT recommended (flag identifies country, NOT language).`

**10.1.4 Using Appropriate Formats/Units of Measurement/Currency**: For international use, input/output of information elements (currency, units of measurement, temperatures, date/time, phone numbers, address, postal codes) should be designed so they are usable by international audience.`

**Example 1**: Web user interface providing means for financial transactions/info about prices shows currency applicable.`

**Example 2**: Address input fields on order form designed to accommodate addresses from all countries concerned.`

**Example 3**: Date "February 3, 2008" shown in standardized format 2008-02-03 (see ISO 8601) instead of "02/03/08" (can be misunderstood).`

**10.1.5 Designing Presentation of Text in Different Languages**: For multilingual Web user interfaces, characteristics of different languages should be taken into account when designing presentation/layout of text.`

**Note**: For users of Asian characters (Kanji, Chinese, Hangul), styled texts are difficult to read. Bold style makes words unclear + italic style collapses characters (Asian characters composed of more strokes than Latin characters).`

### 10.2 Providing Help`
Where content/functionality might NOT be obvious to all users, suitable help information should be provided (see ISO 9241-13) with clearly identifiable links leading to help pages.`

**Good practice**: Offer FAQ (Frequently Asked Questions) section to help users with commonly experienced issues/problems.`

### 10.3 Making Web User Interfaces Error-Tolerant`

**10.3.1 Minimizing User Errors**: Potential user errors as well as effort needed to recover from errors should be minimized.`

**Example**: For hotel room booking, return date automatically set to same as start date (sensible default).`

**10.3.2 Providing Clear Error Messages**: Content of error messages shown on Web pages should clearly state why error occurred + (if possible) actions user can take to resolve error.`

**Note**: Users expect error messages to be in same language as Web user interface.`

### 10.4 URL Names`
Name of URL used for accessing website should conform to user expectations.`

**Example**: Products overview page of company xyz can be accessed by URL www.xyz.com/products/.`

### 10.5 Acceptable Download Times`
Exploration (e.g., home page) should be accessible within acceptable download time (influenced by user expectation + other usability characteristics of site).`

### 10.6 Using Generally Accepted Technologies and Standards`
Generally accepted Web technology standards should be used when appropriate for purpose of Web application + user's tasks (applying them according to specification).`

**Benefits**: Using widely accepted standards (XHTML, CSS, others) reduces risk that user agents/assistive technologies are NOT able to present Web user interface appropriately. Important for BOTH usability + accessibility.`

### 10.7 Supporting Common Technologies`
Web user interfaces should work effectively with different commonly used technologies (different browsers) or typical technical characteristics (screen sizes).`

### 10.8 Making Web User Interfaces Robust`
Web user interfaces should be designed to be as robust as possible in face of changing technology. Encompasses being able to present content containing newer technologies by older user agents AS WELL AS designing content to be usable with future technologies.`

**Example**: Page containing Java applet designed so its content can still be presented/understood when Java plugin NOT available.`

### 10.9 Designing for Input Device Independence`
Web user interfaces should be designed to allow activation of controls by variety of input devices.`

**Importance**:`
- Users who prefer certain input mode`
- Mobile users`
- Users with disabilities`

**General**: Device independence can be achieved if functionality is operable via keyboard. Would allow (for example) use of speech input as alternative technique for operating controls. Keyboard input also important for highly experienced users (helps speed up interaction).`

### 10.10 Making User Interface of Embedded Objects Usable/Accessible`
When objects (Java applet, media player) embedded in Web page, user interface of such objects should fulfil same usability/accessibility requirements as Web user interface in which they are embedded.`

## Annex A: Overview of ISO 9241 Series!

**Structure reflects original ISO 9241 standard numbering**:`
- **100 series**: Software interfaces (Introduction, Dialogue principles, Web user interfaces, Software accessibility)`
- **200 series**: Human centred design (Human-centred design processes)`
- **300 series**: Visual displays (Electronic visual display requirements, Terminology, User performance test methods)`
- **400 series**: Physical input devices (Principles/requirements, Design criteria, Selection procedures)`
- **900 series**: Tactile and haptic interactions (Guidance, Framework, Evaluation)`

**Key parts related to Web**:`
- Part 11: Guidance on usability`
- Part 12: Presentation of information`
- Part 13: User guidance`
- Part 14: Menu dialogues`
- Part 15: Command dialogues`
- Part 16: Direct manipulation dialogues`
- Part 17: Form filling dialogues`
- Part 20: Accessibility guidelines for ICT equipment/services`
- Part 110: Dialogue principles`
- **Part 151: Guidance on World Wide Web user interfaces** (THIS PART)`
- Part 171: Guidance on software accessibility`

## Annex B: Sample Procedure for Assessing Conformance!

**Checklist (Table B.1)**: Can be used to determine whether applicable recommendations have been followed.`

**Procedure**:`
1. **Determine applicability**: Each recommendation has "shall" (requirement) or "should" (recommendation). Determine if conditional statement is TRUE → Y/N.`
   - Methods: System documentation analysis, Documented evidence, Observation, Analytical evaluation, Empirical evaluation`

2. **Determine conformance**: If applicable (Y): Determine whether met using:`
   - Measurements, Observation, Documented evidence, Analytical evaluation, Empirical evaluation`

3. **Record results**:`
   - Column 1-2: Clause/subclause numbers + titles`
   - Column 3: Applicability (Y/N) + Reason not applicable`
   - Column 5-7: Conformance (Y/Partial/N) + Comments (method used, observations)`

**Adherence Rating (AR)**: (Number of P checks) / (Number of Y checks) × 100%`

**Note**: AR is arithmetic count, NOT reliable measurement of degree of adherence without considering respective weights.`

## Checklist for ISO 9241-151:2008 Compliance!

### High-Level Design!
□ Purpose of Web application explicitly defined`
□ Target user groups identified`
□ Users' goals/tasks analysed`
□ Application purpose matches user goals`
□ Purpose easily recognized by user`
□ Design goals prioritized (conflicts addressed)`
□ ICT accessibility (ISO 9241-20) consulted`
□ Software accessibility (ISO 9241-171) consulted`
□ Web content accessibility (WCAG) consulted`
□ Website + owner identity clearly presented on ALL pages`
□ Coherent multi-site strategy (if multiple sites)`

### Content Design!
□ Conceptual content model developed + based on user tasks/mental models`
□ Content suitable for purpose + target audience`
□ Content sufficiently complete for purpose + user needs`
□ Content structured based on user tasks + mental model`
□ Appropriate level of granularity for content units`
□ Content objects selected (text, images, media) - independence of content/structure/presentation`
□ Appropriate media objects selected for content type + user tasks`
□ Text equivalents provided for ALL non-text media`
□ Users can control time-dependent media (pause/stop)`
□ Content kept up-to-date (no out-of-date shown)`
□ Date/time of last update available`
□ Communication with website owner enabled`
□ Online user feedback mechanism provided`
□ Privacy policy provided (if personal info required)`
□ Business policy provided (if relevant)`
□ User control of personal info (opt-in preferred)`
□ Storing info on user's machine - policy explicit`
□ Individualization/adaptation evident to user`
□ User profiles evident (if used)`
□ Users can see/change/delete profiles`
□ Users informed about automatically generated profiles`
□ Users can switch off automatic adaptation`
□ Users can access complete content (if profile-based navigation)`

### Navigation and Search!
□ Navigation self-descriptive (users know where they are/where to go)`
□ Users shown where they are in navigation structure`
□ Different navigation behaviours supported`
□ Alternative access paths offered`
□ Navigation effort minimized`
□ Suitable navigation structure selected (hierarchy, network, sequence)`
□ Breadth vs. depth appropriately balanced`
□ Navigation organized meaningfully (content/task/frequency-based)`
□ Task-based navigation offered (for well-defined tasks)`
□ Clear navigation within multi-step tasks`
□ Different ways of organizing navigation combined effectively`
□ Navigation overviews provided (site map available)`
□ Navigation links permanently visible or easily made visible`
□ Consistency between navigation components + content`
□ Navigation components placed consistently`
□ Several levels of navigation visible`
□ Navigation overviews NOT split into too many components`
□ Cross-linking to potentially relevant content`
□ Dynamic navigation links made obvious`
□ Links back to home page or landmark pages`
□ "Step back" function for multi-step tasks`
□ Long pages subdivided into meaningful sections`
□ Explicit activation for navigation steps`
□ Unnecessary splash screens avoided`
□ Option to skip splash screens provided`
□ Unnecessary windows avoided`
□ "Dead links" avoided`
□ Incorrect links avoided`
□ Search function provided (unless explorable with acceptable effort)`
□ Appropriate search functions (simple + advanced if needed)`
□ Search technique described sufficiently`
□ Search available from ALL pages`
□ Search field sufficiently large for typical query`
□ Shortcut to search function (Enter key)`
□ Error-tolerant search (useful results despite errors)`
□ Search results ordered meaningfully`
□ Relevance-based ranking explained to user`
□ Search results sufficiently descriptive`
□ Sorting/filtering of results available`
□ Scope of search made explicit`
□ Users can select scope of search`
□ Feedback on volume of search results`
□ Handling large result sets consistent`
□ Query shown with results`
□ Advice for unsuccessful searches`
□ Option to repeat searches`
□ Mechanism to refine searches`

### Content Presentation!
□ Page titles + ownership + last update displayed`
□ Consistent page layout across website`
□ Title information placed consistently`
□ New/significantly changed content recognized`
□ Temporal status of page visualized (if time-dependent)`
□ Appropriate page lengths selected`
□ Vertical scrolling minimized`
□ Horizontal scrolling avoided`
□ Colour used with care (NOT only means of conveying info, ≤10 colours for coding)`
□ Frames used with care (each titled + described)`
□ Alternative to frames provided`
□ Alternative text-only pages available`
□ Consistent design across related websites`
□ Appropriate techniques for defining layout (CSS vs. HTML tables)`
□ ALL pages identifiable as parts of website (logo, etc.)`
□ Printable document versions provided (if needed)`
□ "White space" used appropriately (NOT impeding skimming)`
□ Links easily recognisable (underlining, colour, highlighting)`
□ Adjacent links visually separated`
□ Navigation links distinguished from transactions`
□ Self-explanatory link cues (clear indication of target)`
□ Familiar terminology for navigation links`
□ Descriptive link labels (avoid "click here", "go")`
□ Previously visited links highlighted`
□ Links to special targets marked (file format, size, language)`
□ Links opening new windows marked`
□ Navigation links distinguished from controls`
□ Within-page links distinguishable`
□ Link length appropriate (readable, no wrapping)`
□ Redundant links have consistent labels`
□ Link overload avoided (doesn't impede readability)`
□ Page titles usable as bookmarks`

### Text Design!
□ Text readable (display characteristics + spatial arrangement)`
□ Text skimming supported (links, bullets, keywords, headings)`
□ Appropriate writing style (short sentences, bullet points)`
□ Text quality (spelling/grammar) - doesn't impede readability`
□ Language used identified (HTML markup)`
□ Text resizable by user`

### Interaction Objects!
□ Appropriate interaction objects selected (based on input type, values, user tasks)`
□ Keyboard shortcuts provided for important links/objects`

### General Design Aspects!
□ Cultural diversity + multilingual use considered`
□ Relevant location information shown`
□ Supported languages identified + clearly presented`
□ Appropriate formats/units (currency, date, time, address) for international use`
□ Text in different languages - presentation/layout appropriate`
□ Help information provided (FAQ section)`
□ User errors minimized + clear error messages provided`
□ URL names conform to user expectations`
□ Acceptable download times for exploration`
□ Generally accepted technologies/standards used`
□ Common technologies supported (different browsers, screen sizes)`
□ Web user interfaces robust (usable with changing technology)`
□ Input device independence (operable by keyboard, multiple devices)`
□ Embedded objects - usable + accessible (same requirements as host page)`

## When to Apply Each Clause!

| Context | Priority Clauses |
|---|---|
| Website purpose + target users | Clause 6 (High-level design) |
| Content structure + organization | Clause 7 (Content design) |
| Navigation + search functions | Clause 8 (Navigation and search) |
| Page layout + links + text | Clause 9 (Content presentation) |
| Cultural + multilingual + help | Clause 10 (General design aspects) |
| Conformance assessment | Annex B (Checklist) |

## Relationship with Other Standards!

| Standard | Relationship to ISO 9241-151 |
|---|---|
| ISO 9241-11 | Usability guidance |
| ISO 9241-12 | Presentation of information |
| ISO 9241-13 | User guidance |
| ISO 9241-20 | ICT accessibility |
| ISO 9241-110 | Dialogue principles |
| **ISO 9241-151** | **Guidance on Web user interfaces (THIS PART)** |
| ISO 9241-171 | Software accessibility |
| ISO 13407 | Human-centred design processes |
| ISO 14915-2 | Multimedia user interfaces |
| WCAG 1.0/2.0 | Web Content Accessibility Guidelines |
| ISO 639 | Codes for language names |
| ISO 8601 | Date/time representation |

## Key Terms Defined!

| Term | Definition |
|---|---|
| Boolean search | Search using logical operators |
| Conceptual content model | Abstract model describing concepts + relationships |
| Content object | Interactive/non-interactive object (text, image, video, sound) |
| Dynamic navigation link | Computed dynamically by system (e.g., from database) |
| Frameset | Collection of frames + layout structure |
| Home page | Start page through which users enter website (typically) |
| Interaction object | Component accepting user input (links, buttons, fields) |
| Internet | Worldwide interlinked computer systems |
| Intranet | Computer network using Internet standards (limited to organization) |
| Landmark page | Main page directly accessible from many other pages |
| Link (hyperlink) | Reference from one document to another |
| Media object | Component implemented by single media type |
| Navigation | Movement between Web pages or within page |
| Navigation component | Group of navigation elements placed together |
| Navigation structure | Structure composed of segments + links |
| Profile (user profile) | Set of attributes unique to user/user group |
| Predefined user profile | Profile based on stereotype/combination |
| Rendering | Act whereby information in document is presented |
| Screen reader | Assistive technology (text-to-speech or Braille) |
| Site map | Textual/graphical overview of navigation structure |
| Splash screen | Temporary page shown prior to homepage |
| Tool tip | Small pop-up showing explanatory text |
| Transaction | Action involving inserting/updating/deleting info |
| URL (Uniform Resource Locator) | Mechanism for identifying resources on Internet |
| Web application | Provides functionality through browser using Web formats/protocols |
| Web page | Coherent presentation of content/interaction objects |
| Web user interface | All aspects related to content, navigation, presentation |
| Website (site) | Coherent collection of interlinked Web resources |

## Key Design Considerations!

1. **Web user interfaces** - content, navigation, presentation (NOT technical implementation)`
2. **5-level reference model** - Address higher levels before lower levels`
3. **Conceptual model** - Based on user tasks/mental models + existing info structures`
4. **Navigation structures** - Hierarchies, networks, sequences, or combinations`
5. **Search functions** - Simple + advanced (appropriate for user goals/experience)`
6. **Accessibility** - ICT (ISO 9241-20), Software (ISO 9241-171), Web Content (WCAG)`
7. **Content independence** - Separate content, structure, presentation (aids accessibility)`
8. **Media selection** - Based on content type, user tasks, communication goal`
9. **Individualization/adaptation** - Evident to user, can be switched off`
10. **Error tolerance** - Minimize errors, clear error messages, helpful search`
