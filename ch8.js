window.CHAPTERS = window.CHAPTERS || {};
window.CHAPTERS[8] = {
learn: `
<h2>8.1 Basic Concept of Simulation Tools</h2>
<p>Simulation tools are software packages designed specifically for building and running simulation models. They reduce programming effort and provide built-in features for model development.</p>
<h3>Why Use Simulation Tools?</h3>
<ul>
<li><strong>Reduced programming effort:</strong> Pre-built components for common operations</li>
<li><strong>Built-in statistical analysis:</strong> Automatic data collection and reporting</li>
<li><strong>Standardized model building:</strong> Consistent methodology</li>
<li><strong>Faster development:</strong> Less time from concept to working model</li>
<li><strong>Automatic event scheduling:</strong> Event management handled by the system</li>
<li><strong>Animation and visualization:</strong> Visual representation of model execution</li>
</ul>

<h3>Types of Simulation Languages</h3>
<table class="comparison-table">
<tr><th>General-Purpose Languages</th><th>Special-Purpose Simulation Languages</th></tr>
<tr><td>C, C++, Java, Python, FORTRAN</td><td>GPSS, SIMSCRIPT, SIMULA, MODELICA, SLAM, Arena, CSSL</td></tr>
<tr><td>Flexible but requires more coding</td><td>Built-in simulation constructs</td></tr>
<tr><td>No built-in simulation support</td><td>Automatic event scheduling, statistics</td></tr>
<tr><td>Steep learning curve for simulation</td><td>Easier for simulation-specific tasks</td></tr>
</table>

<h2>8.2 CSSLs and GPSS</h2>
<h3>CSSL (Continuous System Simulation Language)</h3>
<p>A family of languages designed for <strong>continuous system simulation</strong> using differential equations.</p>
<p><strong>Examples:</strong> CSMP (Continuous System Modeling Program), CSSL-IV, ACSL</p>
<h4>CSSL Program Structure</h4>
<table class="comparison-table">
<tr><th>Section</th><th>Purpose</th></tr>
<tr><td><strong>INITIAL</strong></td><td>Set initial values of variables, define parameters</td></tr>
<tr><td><strong>DYNAMIC</strong></td><td>Define the differential equations and system behavior over time</td></tr>
<tr><td><strong>TERMINAL</strong></td><td>Post-simulation calculations, output results, clean up</td></tr>
</table>

<h3>GPSS (General Purpose Simulation System)</h3>
<div class="concept-box important">
<h4>Most Important Topic in This Chapter</h4>
<p>GPSS is asked in almost every exam paper! Know the block diagram symbols and how to model systems.</p>
</div>
<p>GPSS is a <strong>block-oriented language</strong> designed for <strong>discrete-event simulation</strong>. It uses the concept of <strong>transactions</strong> (temporary entities) that flow through <strong>blocks</strong>.</p>

<div class="concept-box">
<h4>What GPSS is — the points the notes make</h4>
<ul>
<li>GPSS is a <strong>discrete-time, general-purpose</strong> programming language: the <strong>simulation clock advances in discrete steps</strong>, not continuously.</li>
<li>A system is modelled as <strong>transactions entering the system and being passed from one service to another</strong>.</li>
<li>A GPSS model is a <strong>network of block diagrams</strong>, each block with its own name and function — GPSS supplies <strong>48 different block types</strong>.</li>
<li>It is <strong>less flexible than SIMULA or SIMSCRIPT, but easier to use and the most popular</strong> of the simulation languages. That contrast is a standard question.</li>
<li>It was designed for <strong>analysts who were not necessarily computer programmers</strong> — which is why the model is drawn as blocks rather than written as code.</li>
<li>It is <strong>particularly well suited to factory / manufacturing</strong> problems.</li>
</ul>
</div>

<h4>Key Concepts</h4>
<ul>
<li><strong>Transactions:</strong> Temporary entities that move through the system (like customers)</li>
<li><strong>Blocks:</strong> Operations performed on transactions (like service stations)</li>
<li><strong>Facilities:</strong> Resources that can serve one transaction at a time</li>
<li><strong>Storages:</strong> Resources that can serve multiple transactions simultaneously</li>
</ul>

<h4>GPSS Block Diagram Symbols</h4>
<table class="comparison-table">
<tr><th>Block</th><th>Symbol Shape</th><th>Function</th></tr>
<tr><td><strong>GENERATE</strong></td><td>Semicircle (flat side down)</td><td>Create transactions (arrivals). Parameters: mean inter-arrival time, spread</td></tr>
<tr><td><strong>TERMINATE</strong></td><td>Circle (○)</td><td>Destroy transactions (departures). Decrements termination counter</td></tr>
<tr><td><strong>SEIZE</strong></td><td>Rectangle with notch</td><td>Capture a facility (server). Transaction "owns" the facility</td></tr>
<tr><td><strong>RELEASE</strong></td><td>Rectangle with notch (opposite)</td><td>Free a facility for other transactions</td></tr>
<tr><td><strong>ADVANCE</strong></td><td>Rectangle</td><td>Delay transaction for specified time (service time)</td></tr>
<tr><td><strong>QUEUE</strong></td><td>Rectangle</td><td>Enter a queue — records queue statistics</td></tr>
<tr><td><strong>DEPART</strong></td><td>Rectangle</td><td>Leave a queue — stops recording wait time</td></tr>
<tr><td><strong>ENTER</strong></td><td>Rectangle</td><td>Enter a storage (multi-server facility)</td></tr>
<tr><td><strong>LEAVE</strong></td><td>Rectangle</td><td>Leave a storage</td></tr>
<tr><td><strong>TRANSFER</strong></td><td>Diamond</td><td>Route transactions to different blocks (branching)</td></tr>
<tr><td><strong>TEST</strong></td><td>Diamond</td><td>Conditional test — route based on condition</td></tr>
<tr><td><strong>START</strong></td><td>Control</td><td>Begin simulation, set termination counter</td></tr>
</table>

<div class="concept-box warn">
<h4>Drawing the blocks correctly</h4>
<p><strong>GENERATE is a semicircle, not a triangle.</strong> The notes draw it as a half-oval sitting on the line; the only diamond in the diagram is TRANSFER (and TEST). Marks are lost for a wrong symbol even when the program is right, so draw GENERATE as the semicircle and TERMINATE as the plain circle.</p>
</div>

<h4>Block syntax — what each operand means</h4>
<p>The symbols say which block to use; the operands say what to write in it. These are the ones the notes spell out:</p>
<table class="comparison-table">
<tr><th>Block</th><th>Syntax</th><th>Operands</th></tr>
<tr><td><strong>GENERATE</strong></td><td>GENERATE A,B</td><td>A = mean inter-arrival time, B = modifier (spread)</td></tr>
<tr><td><strong>QUEUE</strong></td><td>QUEUE A</td><td>A = name of the queue. Instructs GPSS to start gathering queuing statistics for that queue</td></tr>
<tr><td><strong>DEPART</strong></td><td>DEPART A</td><td>A = name of the queue. The transaction is leaving it — stop timing the wait</td></tr>
<tr><td><strong>SEIZE</strong></td><td>SEIZE A</td><td>A = name of the facility. Taken only if it is free</td></tr>
<tr><td><strong>RELEASE</strong></td><td>RELEASE A</td><td>A = name of the facility. Gives up ownership of it</td></tr>
<tr><td><strong>ADVANCE</strong></td><td>ADVANCE A,B</td><td>A = mean service time, B = modifier</td></tr>
<tr><td><strong>TERMINATE</strong></td><td>TERMINATE A</td><td>A = amount by which the simulation counter is decremented</td></tr>
<tr><td><strong>TRANSFER</strong></td><td>TRANSFER A,B,C</td><td>Sends the transaction to one of two labelled locations. The notes define A = probability value (0 to 1), B = proportion of (1&#8722;A) transactions going to that labelled location, C = proportion A going to that location</td></tr>
</table>

<div class="example-box">
<h4>GPSS Model: Simple Bank Queue</h4>
<p>Customers arrive → wait in queue → get served by teller → leave</p>
<p><strong>Block Diagram:</strong></p>
<ol>
<li><strong>GENERATE</strong> 5,2 → Create customers (mean=5 min, spread=±2 min)</li>
<li><strong>QUEUE</strong> TLINE → Enter the teller line</li>
<li><strong>SEIZE</strong> TELLER → Capture the teller</li>
<li><strong>DEPART</strong> TLINE → Leave the queue</li>
<li><strong>ADVANCE</strong> 4,1 → Service time (mean=4 min, spread=±1 min)</li>
<li><strong>RELEASE</strong> TELLER → Free the teller</li>
<li><strong>TERMINATE</strong> 1 → Customer leaves (decrement counter by 1)</li>
<li><strong>START</strong> 100 → Simulate 100 customers</li>
</ol>
</div>

<h4>Four GPSS programs from the class notes</h4>
<p>These are the worked models the notes carry, written out as programs. Every one follows the same skeleton — <strong>GENERATE → QUEUE → SEIZE → DEPART → ADVANCE → RELEASE → TERMINATE</strong> — so once the skeleton is memorised, only two things change between questions: the two time values, and how the transaction ends.</p>

<div class="example-box">
<h4>1. Barber shop — a customer every 10 ± 2 min, a haircut 13 ± 2 min</h4>
<p><em>“Create a GPSS model and program it to simulate a barber shop for a day (9 AM – 4 PM) where customers enter the shop every (10 ± 2) minutes and a barber takes (13 ± 2) minutes for a haircut.”</em></p>
<p>The shortest correct answer uses only three blocks, because a single barber with nobody to interrupt him needs no queue at all:</p>
<div class="code-block">GENERATE  10,2      // a customer arrives every 10 ± 2 minutes
ADVANCE   13,2      // the haircut takes 13 ± 2 minutes
TERMINATE 1         // the customer leaves
</div>
<p>The full model — the one to draw when the question says “create a model” — adds the waiting line and the barber as a facility:</p>
<div class="code-block">GENERATE  10,2        // a customer arrives every 10 ± 2 minutes
QUEUE     SIT         // joins the waiting line
SEIZE     HAIRCUT     // takes the barber, if he is free
DEPART    SIT         // leaves the line, the haircut starts
ADVANCE   13,2        // the haircut takes 13 ± 2 minutes
RELEASE   HAIRCUT     // frees the barber
TERMINATE 1           // the customer leaves
</div>
<p><strong>Stopping at 4 PM.</strong> A GPSS run ends when its termination counter reaches zero, so “for a day” has to be modelled. The shop is open 9 AM – 4 PM = <strong>420 minutes</strong>, and the usual way is a second, independent transaction that simply waits out the day:</p>
<div class="code-block">GENERATE  420       // the “timer” transaction
TERMINATE 1         // …and the run stops
START     1         // one terminating transaction ends the simulation
</div>
<span class="worked-note">The three-block version and the seven-block version are the same model — the short one silently assumes no customer ever waits. Say which assumption you are making, and give the run length: 420 minutes, not “a day”.</span>
</div>

<div class="example-box">
<h4>2. Supermarket checkout</h4>
<p><em>“Use GPSS to simulate a supermarket model.”</em></p>
<div class="code-block">GENERATE  5,1                  // shoppers arrive every 5 ± 1 minutes
QUEUE     CHECKOUT-QUEUE       // join the checkout queue
SEIZE     CHECKOUT-QUEUE       // take the checkout, if it is free
DEPART    CHECKOUT-QUEUE       // leave the queue, paying starts
ADVANCE   3,1                  // paying takes 3 ± 1 minutes
RELEASE   CHECKOUT-QUEUE       // free the checkout
TERMINATE 1                    // the shopper leaves
</div>
<span class="worked-note">The same seven blocks as the barber shop. Note the naming convention: QUEUE and DEPART take a <em>queue</em>, while SEIZE and RELEASE take a <em>facility</em>. The notes use one name for both here; naming them separately (QUEUE CHECKOUT-QUEUE, SEIZE CHECKOUT) is safer in a full answer.</span>
</div>

<div class="example-box">
<h4>3. Manufacturing shop with an inspector — 15 % rejected</h4>
<p><em>“A machine tool in a manufacturing shop is turning out parts at a rate of one every 7 minutes. As they are finished the parts go to an inspector who takes (5 ± 2) minutes to examine one and rejects 15 % of the parts.”</em></p>
<div class="code-block">GENERATE  7,0            // the machine produces a part every 7 minutes
QUEUE     1              // the parts wait for the inspector
SEIZE     1              // take the inspector, if he is free
DEPART    1              // leave the queue, inspection starts
ADVANCE   5,2            // inspection takes 5 ± 2 minutes
RELEASE   1              // free the inspector
TRANSFER  0.15,ACC,REJ   // 15 % of the parts are rejected
ACC       TERMINATE 1    // an accepted part leaves the shop
REJ       TERMINATE 1    // a rejected part leaves the shop
</div>
<span class="worked-note">The first model that needs TRANSFER (the diamond): one stream of transactions splits into two ends. ACC and REJ are the labels of the two blocks the branch goes to, so write them on the block diagram too — the operands refer to them. The notes write this block as “TRANSFER 0.15 Acc Rej”, i.e. the same three operands.</span>
</div>

<div class="example-box">
<h4>4. Soap testing — 90 % good</h4>
<p><em>“In a manufacturing company soap comes to the testing room every 10 seconds with an offset value 2 seconds. In the testing room it takes 30 seconds to test whether a soap is of good quality or not. If it is good quality then it is accepted, otherwise it is rejected. It is found that 90 % of soap is of good quality. Show GPSS simulation.”</em></p>
<div class="code-block">GENERATE  10,2          // a soap arrives every 10 ± 2 seconds
QUEUE     1             // soaps wait for the testing room
SEIZE     1             // take the tester, if it is free
DEPART    1             // leave the queue, testing starts
ADVANCE   30,0          // testing takes 30 seconds (B = 0, no spread)
RELEASE   1             // free the tester
TRANSFER  0.1,ACC,REJ   // 10 % are rejected, because 90 % are good
ACC       TERMINATE 1   // a good soap leaves
REJ       TERMINATE 1   // a rejected soap leaves
</div>
<span class="worked-note">Two traps. First the probability: the question gives 90 % <em>good</em>, but the branch that fires is the <em>rejected</em> one, so the operand is 0.1, not 0.9 — the same convention as the inspector above, where the notes' A is the rejected fraction. Second the “offset value 2”: that is the GENERATE modifier for the arrivals (10 ± 2 seconds), while testing has no spread, so ADVANCE takes B = 0.</span>
</div>

<h2>8.3 Discrete Systems Modeling and Simulation</h2>
<p>In <strong>discrete-event simulation</strong>, state changes occur only at discrete points in time (events).</p>

<h3>Components of Discrete-Event Simulation</h3>
<ul>
<li><strong>System State:</strong> Variables describing the system at any time</li>
<li><strong>Simulation Clock:</strong> Current simulated time</li>
<li><strong>Event List:</strong> List of future events scheduled to occur</li>
<li><strong>Statistical Counters:</strong> Accumulate statistics about system performance</li>
<li><strong>Initialization Routine:</strong> Set initial values</li>
<li><strong>Timing Routine:</strong> Determine next event from event list</li>
<li><strong>Event Routines:</strong> Process each type of event</li>
<li><strong>Report Generator:</strong> Calculate and output statistics</li>
</ul>

<h3>Clock Advancing Approaches</h3>
<table class="comparison-table">
<tr><th>Next-Event Time Advance</th><th>Fixed-Increment Time Advance</th></tr>
<tr><td>Clock jumps to time of next scheduled event</td><td>Clock advances by fixed Δt each step</td></tr>
<tr><td>Skips idle periods — more efficient</td><td>Checks for events at each increment</td></tr>
<tr><td>Variable time steps</td><td>Fixed time steps</td></tr>
<tr><td>Most commonly used</td><td>Simpler but less efficient</td></tr>
<tr><td>Used in GPSS, SIMSCRIPT</td><td>Used when many events occur continuously</td></tr>
</table>

<h2>8.4 Continuous Systems Modeling and Simulation</h2>
<p>Continuous simulation languages (CSSLs) model systems where state changes continuously over time. Models are specified as sets of <strong>differential equations</strong>.</p>
<p><strong>Numerical methods</strong> (Euler, Runge-Kutta) are used to solve the equations at each time step.</p>
<p><strong>CSMP Example:</strong> For dx/dt = -2x with x(0)=10:</p>
<ul>
<li>INITIAL: X = 10.0</li>
<li>DYNAMIC: XDOT = -2.0*X, X = INTGRL(10.0, XDOT)</li>
<li>TERMINAL: PRINT X</li>
</ul>

<h2>8.5 Structural, Data and Control Statements</h2>
<h3>SIMSCRIPT</h3>
<p>An <strong>event-oriented</strong> simulation language with three main concepts:</p>
<ul>
<li><strong>Entities:</strong> Objects in the system (permanent and temporary)</li>
<li><strong>Attributes:</strong> Properties of entities</li>
<li><strong>Sets:</strong> Collections of entities (like queues)</li>
</ul>
<h4>Program Organization</h4>
<table class="comparison-table">
<tr><th>Section</th><th>Purpose</th></tr>
<tr><td><strong>Preamble</strong></td><td>Declarations — define entities, attributes, sets, events</td></tr>
<tr><td><strong>Main</strong></td><td>Initialization — set initial conditions, schedule first events</td></tr>
<tr><td><strong>Event Routines</strong></td><td>Define what happens when each event occurs</td></tr>
</table>
<p>That three-part view is SIMSCRIPT's standard shape. The class notes answer the same question — <em>“how is a program organized in SIMSCRIPT?”</em> — with <strong>seven sections</strong>, and that is the version to write out in the exam:</p>
<table class="comparison-table">
<tr><th>#</th><th>Section</th><th>What goes in it</th></tr>
<tr><td>1</td><td><strong>Declaration section</strong></td><td>Defines the elements of the simulation model — arrays and data types, and the entities, resources and parameters to be used. For a queuing system: <code>INTEGER n_customers, service_time, total_service_time</code> and <code>REAL Arrival_Rate</code></td></tr>
<tr><td>2</td><td><strong>Initialization section</strong></td><td>Sets the initial values of the variables and resources: <code>n_customers = 0</code>, <code>total_service_time = 0</code>, <code>arrival_rate = 0.5</code></td></tr>
<tr><td>3</td><td><strong>Event scheduling</strong></td><td>SIMSCRIPT is event-driven: events are scheduled to occur at specific times, and each event corresponds to a change in the system — arrival of a customer, waiting in a queue, service to the customer</td></tr>
<tr><td>4</td><td><strong>Simulation logic</strong></td><td>Three things together: <strong>processes</strong> (procedures or functions defining how entities move through the system), <strong>event handlers</strong> (the logic to execute when an event occurs), and <strong>control statements</strong> (<code>if/else</code>, loops, branching — to manage the flow and take decisions)</td></tr>
<tr><td>5</td><td><strong>Run control</strong></td><td>The program runs until a specified condition is met</td></tr>
<tr><td>6</td><td><strong>Reporting and output</strong></td><td>After the run, the reports and output data: statistics, performance metrics, results</td></tr>
<tr><td>7</td><td><strong>Termination</strong></td><td>The run ends when a predefined termination condition is met — completing a specific number of events, or reaching a particular time</td></tr>
</table>

<div class="example-box">
<h4>A worked SIMSCRIPT program</h4>
<p>The same small queuing model written out, so the seven sections can be seen in place: the entities are declared first, each event gets its own handler, and the main logic schedules the first event and then steps the clock.</p>
<div class="code-block">// 1. Declaration of entities and variables
entity customer;
entity server;
integer queue_size;

// 4. Event handler for processing a customer
event process_customer() {
    print("processing customer");
    wait(3);
    print("customer processed");
}

// 4. Event handler for a customer arrival
event customer_arrival() {
    print("customer arrived");
    schedule(process_customer, 0);
}

// 3, 5 and 7. Main logic, run control and termination
start_simulation() {
    schedule(customer_arrival, 1);
    for (time_step = 1; time_step &lt;= 10; time_step++) {
        run_event(time_step);
    }
    print("simulation complete");
}

start_simulation();
</div>
<span class="worked-note">Three things the marker looks for: the <strong>entities declared before anything else</strong>, each <strong>event written as its own handler</strong>, and the logic that <strong>schedules</strong> the first event and then advances the clock — here <code>run_event(time_step)</code> for ten steps, after which the run terminates.</span>
</div>

<h3>Statement Types</h3>
<ul>
<li><strong>Structural Statements:</strong> Define system structure (entities, resources, processes)</li>
<li><strong>Data Statements:</strong> Define input data, parameters, distributions</li>
<li><strong>Control Statements:</strong> Control simulation execution (START, STOP, RESET, CLEAR)</li>
</ul>

<h2>8.6 Feedback Systems: Typical Applications</h2>
<p>Feedback systems in simulation language context involve modeling systems where output influences input.</p>
<h3>Applications</h3>
<ul>
<li><strong>Home Heating:</strong> Thermostat measures temperature → controls furnace → temperature changes → thermostat adjusts (negative feedback loop)</li>
<li><strong>Aircraft Autopilot:</strong> Gyroscope detects heading error → adjusts control surfaces → aircraft changes heading → new error measured</li>
<li><strong>Industrial Process Control:</strong> Sensor measures process variable → controller adjusts actuator → process changes → sensor remeasures</li>
<li><strong>Economic Models:</strong> Price increase → demand decrease → supply adjustment → new price (market feedback)</li>
</ul>

<h3>Distributed Lag Model</h3>
<p>A model where the output depends on current AND past inputs:</p>
<div class="formula-box">Y(t) = Σ wᵢ × X(t-i) for i = 0 to k</div>
<p>where wᵢ are weights and X(t-i) are past inputs. Used in economics (effect of investment on GDP) and engineering (thermal systems with delay).</p>
`,

quiz: [
  {q:"GPSS stands for:", options:["General Process Simulation System","General Purpose Simulation System","Global Programming Simulation Software","Generic Process Simulation Software"], answer:1, explanation:"GPSS = General Purpose Simulation System, a block-oriented language for discrete-event simulation."},
  {q:"In GPSS, the GENERATE block:", options:["Destroys transactions","Creates transactions (arrivals)","Captures a facility","Records queue statistics"], answer:1, explanation:"GENERATE creates new transactions (like customer arrivals) and introduces them into the model."},
  {q:"The GENERATE block symbol is a:", options:["Circle","Rectangle","Semicircle","Diamond"], answer:2, explanation:"GENERATE is the semicircle (flat side down) — it creates the flow of transactions. The circle is TERMINATE and the diamond is TRANSFER / TEST. The notes draw GENERATE as the half-oval on the line."},
  {q:"The TERMINATE block:", options:["Creates transactions","Delays transactions","Destroys transactions and decrements counter","Captures a server"], answer:2, explanation:"TERMINATE destroys transactions (departures) and decrements the termination counter."},
  {q:"SEIZE/RELEASE blocks are used for:", options:["Queue management","Facility (server) management","Creating transactions","Timing"], answer:1, explanation:"SEIZE captures a facility (server) and RELEASE frees it for other transactions."},
  {q:"The Next-Event Time Advance method:", options:["Advances clock by fixed Δt","Jumps clock to the next scheduled event","Runs in real time","Never advances the clock"], answer:1, explanation:"Next-Event Time Advance jumps the clock to the time of the next scheduled event, skipping idle periods."},
  {q:"CSSL stands for:", options:["Continuous System Simulation Language","Computer Science Simulation Logic","Complex System Software Language","Control System Simulation Library"], answer:0, explanation:"CSSL = Continuous System Simulation Language, designed for modeling continuous systems using differential equations."},
  {q:"SIMSCRIPT program sections are:", options:["INITIAL, DYNAMIC, TERMINAL","GENERATE, ADVANCE, TERMINATE","Preamble, Main, Event Routines","Input, Process, Output"], answer:2, explanation:"SIMSCRIPT has three sections: Preamble (declarations), Main (initialization), and Event Routines (event processing)."},
  {q:"In a distributed lag model, output depends on:", options:["Only current input","Only past inputs","Current AND past inputs","Future inputs"], answer:2, explanation:"Y(t) = Σwᵢ × X(t-i) — the output depends on both current input X(t) and past inputs X(t-1), X(t-2), etc."},
  {q:"Which is NOT a component of discrete-event simulation?", options:["Event list","Simulation clock","Differential equations","Statistical counters"], answer:2, explanation:"Differential equations are used in CONTINUOUS simulation, not discrete-event simulation."}
],

past: [
  {year:"2025 M", marks:"4", repeats:4, q:"What are the key features of GPSS as a simulation language?", occ:[{year:"2014 F", marks:"3+3", q:"Why is simulation tool required? What is GPSS language & its application?"}, {year:"2014 F", marks:"3", q:"What is GPSS language & its application?"}, {year:"2019 F", marks:"10", q:"Explain GPSS in brief with suitable example"}, {year:"2010 F", marks:"5", q:"Short Note: GPSS"}],
   answer:`<h4>Answer</h4>
<p><strong>Key Features of GPSS:</strong></p>
<ol>
<li><strong>Block-oriented:</strong> Models are built using interconnected blocks that represent operations</li>
<li><strong>Transaction-based:</strong> Temporary entities (transactions) flow through blocks, representing customers, parts, messages</li>
<li><strong>Built-in facilities and storages:</strong> Pre-defined server resources (single-server facilities, multi-server storages)</li>
<li><strong>Automatic statistics:</strong> Queue lengths, utilizations, wait times are automatically tracked</li>
<li><strong>Visual block diagrams:</strong> Each block has a standard symbol (triangle for GENERATE, circle for TERMINATE, etc.)</li>
<li><strong>Event scheduling:</strong> Automatic next-event time advance</li>
<li><strong>Easy to learn:</strong> High-level abstraction makes modeling intuitive</li>
</ol>`},
  {year:"2014 F", marks:"10", repeats:4, q:"What do you mean by discrete event simulation? Explain principal approaches for advancing simulation clock.", occ:[{year:"2014 F", marks:"4+6", q:"What do you mean by discrete event simulation? Explain the principal approaches for advancing the simulation clock in discrete event simulation"}, {year:"2010 F", marks:"4+6", q:"Illustrate discrete event simulation. Explain the principal approaches for advancing the simulation clock in discrete event simulation"}],
   answer:`<h4>Answer</h4>
<h4>Discrete-Event Simulation</h4>
<p>A type of simulation where the system <strong>state changes only at discrete points in time</strong> called events. Between events, the system state remains unchanged. The simulation tracks individual events (arrivals, departures, failures) and processes them chronologically.</p>
<p><strong>Components:</strong> System state, simulation clock, event list, statistical counters, initialization routine, timing routine, event routines, report generator.</p>
<h4>Two Approaches for Advancing Simulation Clock</h4>
<table>
<tr><th>Next-Event Time Advance</th><th>Fixed-Increment Time Advance</th></tr>
<tr><td>Clock jumps to the time of next scheduled event</td><td>Clock advances by fixed amount Δt each step</td></tr>
<tr><td>Skips idle periods between events</td><td>Checks for events at every increment</td></tr>
<tr><td>Variable time steps</td><td>Constant time steps</td></tr>
<tr><td><strong>More efficient</strong> — most commonly used</td><td>Simpler but potentially wasteful</td></tr>
<tr><td>Used in GPSS, SIMSCRIPT, Arena</td><td>Used when events occur frequently</td></tr>
</table>
<p><strong>Next-Event Process:</strong></p>
<ol>
<li>Scan event list for event with smallest time</li>
<li>Advance clock to that event's time</li>
<li>Execute the event routine</li>
<li>Update statistics and schedule new events</li>
<li>Repeat until termination condition</li>
</ol>`},
  {year:"2011 F", marks:"2+4", repeats:4, q:"What do you mean by Discrete-event simulation? Explain the components and organization of a Discrete event simulation model with flow chart", occ:[{year:"2011 F", marks:"2+4", q:"What do you mean by Discrete~event _s~mulatiop?_ E~lain the components and organization of a Discrete event simulation model with flow chart"}, {year:"2019 F", marks:"4+6", q:"Explain the principle of discrete system simulation. Explain feedback system with its application"}, {year:"2012 C", marks:"5", q:"Explain discrete system simulation"}, {year:"2019 F", marks:"4", q:"Explain the principle of discrete system simulation"}],
   answer:`<h4>Answer</h4>

<h4>What a discrete-event simulation is (2 marks)</h4>

<p>A <strong>discrete-event simulation</strong> models a system whose state changes only at separate instants of time called <em>events</em>. Between two consecutive events the state does not change at all, so nothing needs to be computed and the simulation clock simply jumps to the time of the next event. The model therefore consists of a set of event routines, each of which changes the state and schedules future events.</p>

<h4>Components of a discrete-event simulation model (with their job)</h4>

<table class="comparison-table">

<tr><th>Component</th><th>What it holds / does</th></tr>

<tr><td><strong>System state</strong></td><td>The collection of variables that describe the system at a point in time — number of customers in the queue, whether each server is idle or busy, machine status. It changes only inside event routines.</td></tr>

<tr><td><strong>Simulation clock</strong></td><td>A variable giving the current value of simulated time. It is not the wall clock: it jumps from event to event.</td></tr>

<tr><td><strong>Event list</strong></td><td>The list of future events, each with its scheduled time and type, kept in time order. Selecting the smallest time from it is what drives the simulation.</td></tr>

<tr><td><strong>Statistical counters</strong></td><td>Accumulators for the output measures — total waiting time, number served, area under the queue-length curve, maximum queue, utilisation.</td></tr>

<tr><td><strong>Initialization routine</strong></td><td>Sets the clock to 0, sets the system state to its starting value (usually "empty and idle") and builds the initial event list.</td></tr>

<tr><td><strong>Timing routine</strong></td><td>Finds the event with the smallest scheduled time in the event list and advances the clock to it (next-event time advance). Returns control immediately if the list is empty.</td></tr>

<tr><td><strong>Event routines</strong></td><td>One per event type — arrival, departure, breakdown, repair. Each updates the state, updates the statistical counters and schedules the events that follow from it.</td></tr>

<tr><td><strong>Library routines</strong></td><td>Support routines called by the model: random-number generation, sampling from distributions, report printing.</td></tr>

<tr><td><strong>Report generator</strong></td><td>At the end of the run, computes the estimates from the counters (means, utilisation, distributions) and prints or plots them.</td></tr>

</table>

<h4>Organisation of the model — the flow chart</h4>

<figure class="figure-wrap">

<svg class="figure" viewBox="0 0 640 592" role="img" aria-label="Flow chart of a discrete-event simulation model: main program calls initialization, then the timing routine advances the clock, an event routine updates the state and counters and schedules new events, the loop repeats while the event list is not empty, and the report generator runs at the end">

<defs><marker id="fx8" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="flow-arrow-head"/></marker></defs>

<rect class="flow-box phase1" x="92" y="20" width="456" height="42" rx="10"/>

<text class="flow-text" x="320.0" y="47.0">Main program</text>

<path class="flow-arrow" d="M320.0,62 V86" marker-end="url(#fx8)"/>

<rect class="flow-box phase1" x="92" y="86" width="456" height="64" rx="10"/>

<text class="flow-text" x="320.0" y="112.0">Initialization routine</text>

<text class="flow-label" x="320.0" y="132.0">clock = 0 &#183; state = empty &#183; counters = 0</text>

<path class="flow-arrow" d="M320.0,150 V174" marker-end="url(#fx8)"/>

<rect class="flow-box phase2" x="92" y="174" width="456" height="42" rx="10"/>

<text class="flow-text" x="320.0" y="201.0">Timing routine: smallest event time</text>

<path class="flow-arrow" d="M320.0,216 V240" marker-end="url(#fx8)"/>

<rect class="flow-box phase2" x="92" y="240" width="456" height="42" rx="10"/>

<text class="flow-text" x="320.0" y="267.0">Advance the simulation clock</text>

<path class="flow-arrow" d="M320.0,282 V306" marker-end="url(#fx8)"/>

<rect class="flow-box phase3" x="92" y="306" width="456" height="64" rx="10"/>

<text class="flow-text" x="320.0" y="332.0">Event routine i</text>

<text class="flow-label" x="320.0" y="352.0">change state &#183; update counters &#183; schedule new events</text>

<path class="flow-arrow" d="M320.0,370 V394" marker-end="url(#fx8)"/>

<rect class="flow-box phase3" x="92" y="394" width="456" height="42" rx="10"/>

<text class="flow-text" x="320.0" y="421.0">Event list empty?</text>

<path class="flow-arrow" d="M92,415 H58 V195 H92" marker-end="url(#fx8)"/>

<text class="flow-label" x="46.0" y="308.0">No</text>

<path class="flow-arrow" d="M320.0,436 V460" marker-end="url(#fx8)"/>

<text class="flow-label" x="336.0" y="452.0">Yes</text>

<rect class="flow-box phase4" x="92" y="460" width="456" height="42" rx="10"/>

<text class="flow-text" x="320.0" y="487.0">Report generator</text>

<path class="flow-arrow" d="M320.0,502 V526" marker-end="url(#fx8)"/>

<rect class="flow-box phase4" x="92" y="526" width="456" height="42" rx="10"/>

<text class="flow-text" x="320.0" y="553.0">Stop</text>

</svg>

<figcaption>The timing routine and the event routine form the loop that is executed once per event. When the event list is empty the clock has no next event to jump to, so control leaves the loop and the report generator is called.</figcaption>

</figure>

<p><strong>Two ways to advance the clock</strong> (often asked with this question): <em>next-event time advance</em>, where the clock jumps to the smallest scheduled event time and idle periods are skipped — the method used above and by GPSS, SIMSCRIPT and Arena; and <em>fixed-increment time advance</em>, where the clock advances by a constant &#916;t and all events due in that interval are processed. The second is simpler to program but wastes time during idle periods and can process events in the wrong order unless &#916;t is small.</p>`},
  {year:"2015 F", marks:"5", repeats:3, q:"Draw different types of GPSS block-diagram symbols and explain with GPSS block-diagram of manufacturing shop.", occ:[{year:"2015 F", marks:"5", q:"Draw different types of GPSS block-diagram symbols and explain · with the help of GPSS block- diagram of manufacturing shop"}, {year:"2014 F", marks:"4", q:"Explain in details of GPSS block diagram symbols"}, {year:"2014 F", marks:"4", q:"Explain in details of GPSS block diagram symbols"}],
   answer:`<h4>Answer</h4>
<h4>GPSS Block Symbols</h4>
<table>
<tr><th>Block</th><th>Symbol</th><th>Function</th></tr>
<tr><td>GENERATE</td><td>Semicircle (flat side down)</td><td>Create transactions</td></tr>
<tr><td>TERMINATE</td><td>○ (Circle)</td><td>Destroy transactions</td></tr>
<tr><td>SEIZE</td><td>▭ (Rect with left notch)</td><td>Capture facility</td></tr>
<tr><td>RELEASE</td><td>▭ (Rect with right notch)</td><td>Free facility</td></tr>
<tr><td>ADVANCE</td><td>□ (Rectangle)</td><td>Delay time</td></tr>
<tr><td>QUEUE</td><td>□ (Rectangle)</td><td>Enter queue</td></tr>
<tr><td>DEPART</td><td>□ (Rectangle)</td><td>Leave queue</td></tr>
<tr><td>TRANSFER</td><td>◇ (Diamond)</td><td>Route/branch</td></tr>
</table>
<h4>Manufacturing Shop Model</h4>
<ol>
<li><strong>GENERATE</strong> 8,3 — Parts arrive every 8±3 minutes</li>
<li><strong>QUEUE</strong> MACHQ — Enter machine queue</li>
<li><strong>SEIZE</strong> MACHINE — Capture the machine</li>
<li><strong>DEPART</strong> MACHQ — Leave queue</li>
<li><strong>ADVANCE</strong> 6,2 — Machining takes 6±2 minutes</li>
<li><strong>RELEASE</strong> MACHINE — Free the machine</li>
<li><strong>QUEUE</strong> INSPQ — Enter inspection queue</li>
<li><strong>SEIZE</strong> INSPECTOR — Capture inspector</li>
<li><strong>DEPART</strong> INSPQ — Leave inspection queue</li>
<li><strong>ADVANCE</strong> 2,1 — Inspection takes 2±1 minutes</li>
<li><strong>RELEASE</strong> INSPECTOR — Free inspector</li>
<li><strong>TERMINATE</strong> 1 — Part exits the shop</li>
</ol>`},
  {year:"2025 M", marks:"8", repeats:1, q:"Model a discrete-event system of hospital patient flow using GPSS. Outline key control statements.",
   answer:`<h4>Answer</h4>
<h4>Hospital Patient Flow Model</h4>
<p><strong>System:</strong> Patients arrive → register → wait → see doctor → get treatment → leave</p>
<h4>GPSS Block Diagram</h4>
<ol>
<li><strong>GENERATE</strong> 15,5 — Patients arrive every 15±5 minutes</li>
<li><strong>QUEUE</strong> REGLINE — Enter registration queue</li>
<li><strong>SEIZE</strong> CLERK — Capture registration clerk</li>
<li><strong>DEPART</strong> REGLINE — Leave registration queue</li>
<li><strong>ADVANCE</strong> 3,1 — Registration takes 3±1 minutes</li>
<li><strong>RELEASE</strong> CLERK — Free the clerk</li>
<li><strong>QUEUE</strong> DOCLINE — Enter doctor's waiting queue</li>
<li><strong>SEIZE</strong> DOCTOR — See the doctor</li>
<li><strong>DEPART</strong> DOCLINE — Leave doctor's queue</li>
<li><strong>ADVANCE</strong> 10,3 — Consultation takes 10±3 minutes</li>
<li><strong>RELEASE</strong> DOCTOR — Free the doctor</li>
<li><strong>ADVANCE</strong> 5,2 — Treatment/pharmacy time 5±2 minutes</li>
<li><strong>TERMINATE</strong> 1 — Patient leaves hospital</li>
<li><strong>START</strong> 100 — Simulate 100 patients</li>
</ol>
<h4>Key Control Statements</h4>
<ul>
<li><strong>START n:</strong> Begin simulation, terminate after n transactions complete</li>
<li><strong>SIMULATE:</strong> Declares the program as a simulation model</li>
<li><strong>RESET:</strong> Clear statistics but continue simulation</li>
<li><strong>CLEAR:</strong> Reset entire simulation to initial conditions</li>
<li><strong>END:</strong> End of program</li>
</ul>`},
  {year:"2019 F", marks:"10", repeats:1, q:"List out the various simulation tools. Explain GPSS in brief with suitable example.", occ:[{year:"2019 F", marks:"10", q:"List out the various simulation tools. Explain GPSS in brief with suitable example"}],
   answer:`<h4>Answer</h4>
<h4>Simulation Tools</h4>
<ul>
<li><strong>Discrete-Event:</strong> GPSS, SIMSCRIPT, SLAM, Arena, Simul8</li>
<li><strong>Continuous:</strong> CSMP, CSSL-IV, ACSL, Simulink</li>
<li><strong>General-Purpose:</strong> C/C++, Java, Python, FORTRAN</li>
<li><strong>Modern Tools:</strong> AnyLogic, FlexSim, ProModel</li>
</ul>
<h4>GPSS (General Purpose Simulation System)</h4>
<p>Block-oriented language for discrete-event simulation. Transactions flow through blocks.</p>
<p><strong>Key Blocks:</strong> GENERATE (create), TERMINATE (destroy), SEIZE/RELEASE (use server), ADVANCE (delay), QUEUE/DEPART (queue tracking)</p>
<h4>Example: Bank Queue Model</h4>
<ol>
<li><strong>GENERATE</strong> 5,2 — Customers arrive every 5±2 minutes</li>
<li><strong>QUEUE</strong> WAIT — Enter waiting line</li>
<li><strong>SEIZE</strong> TELLER — Capture the teller</li>
<li><strong>DEPART</strong> WAIT — Leave the queue</li>
<li><strong>ADVANCE</strong> 4,1 — Service takes 4±1 minutes</li>
<li><strong>RELEASE</strong> TELLER — Free the teller</li>
<li><strong>TERMINATE</strong> 1 — Customer departs</li>
<li><strong>START</strong> 200 — Simulate 200 customers</li>
</ol>
<p>GPSS automatically collects statistics: average queue length, maximum queue, server utilization, average wait time.</p>`},
  {year:"2015 F", marks:"5", repeats:1, q:"State some types of Simulation languages",
   answer:`<h4>Answer</h4>

<p>Simulation languages fall into two broad families: <strong>general-purpose languages</strong> (C, C++, Java, Python, FORTRAN), in which the event list, the clock and the statistics must be programmed by hand, and <strong>special-purpose simulation languages</strong>, which provide these constructs as built-in features. Only the second family is described as a "simulation language" in this syllabus.</p>

<p>Special-purpose languages are classified by the type of system they model.</p>

<h4>1. Discrete-event simulation languages</h4>

<table class="comparison-table">

<tr><th>Language</th><th>Modelling view</th><th>Notes / typical use</th></tr>

<tr><td><strong>GPSS</strong> (General Purpose Simulation System)</td><td>Process interaction, block diagram</td><td>The classic teaching language: transactions flow through blocks such as GENERATE, QUEUE, SEIZE, ADVANCE, RELEASE, TERMINATE. Automatic statistics. Best for queuing and manufacturing models.</td></tr>

<tr><td><strong>SIMSCRIPT</strong> (II.5)</td><td>Event scheduling and process interaction</td><td>FORTRAN-like, English-like statements, with entities, attributes, sets. Preamble / Main / Event-routine structure. Suits large models and experimentation with alternative policies.</td></tr>

<tr><td><strong>SIMULA</strong></td><td>Process interaction</td><td>Introduced classes and objects into programming; the ancestor of modern object-oriented languages. Used for discrete-event and simulation of computer systems.</td></tr>

<tr><td><strong>SLAM</strong></td><td>Network + event scheduling</td><td>Supports both discrete and continuous (combined) models; represents the model as a network of nodes and activities.</td></tr>

<tr><td><strong>GASP / SIMAN / Arena / Simul8 / AnyLogic</strong></td><td>Event scheduling; visual process flow</td><td>Modern descendants. Arena and Simul8 are graphical; AnyLogic supports discrete, continuous and agent-based modelling.</td></tr>

<tr><td><strong>SimPy</strong></td><td>Process interaction</td><td>A Python library — a general-purpose language extended with simulation constructs.</td></tr>

</table>

<h4>2. Continuous simulation languages (CSSLs)</h4>

<table class="comparison-table">

<tr><th>Language</th><th>Character</th><th>Notes</th></tr>

<tr><td><strong>CSSL / CSSL-IV</strong></td><td>Continuous System Simulation Language</td><td>The reference family for differential-equation models; programs have INITIAL, DYNAMIC and TERMINAL sections.</td></tr>

<tr><td><strong>CSMP</strong></td><td>Continuous System Modeling Program</td><td>Block/statement oriented; widely used for control and servo models.</td></tr>

<tr><td><strong>ACSL</strong></td><td>Advanced Continuous Simulation Language</td><td>Industrial descendant of CSSL with a large library of integration routines.</td></tr>

<tr><td><strong>DYNAMO</strong></td><td>System dynamics</td><td>Fixed-step language for level-and-rate (industrial dynamics) models.</td></tr>

<tr><td><strong>Simulink / Simnon / VisSim</strong></td><td>Graphical block diagrams</td><td>Modern equivalents: the model is drawn, the integrator is chosen from a menu.</td></tr>

</table>

<h4>3. Hybrid languages</h4>

<p><strong>SLAM, SIMSCRIPT II.5, AnyLogic and SIMULINK with Stateflow</strong> allow discrete events and continuous equations in one model, and provide the event-detection and step-control machinery that hybrid models need.</p>

<p><strong>What makes them "simulation languages":</strong> they supply (i) automatic event scheduling, (ii) built-in random-number generation and distribution sampling, (iii) entities, queues and resources as first-class objects, (iv) automatic collection of statistics, and (v) often animation. That is why a model that takes days to write in C takes hours in GPSS or Arena.</p>`},
  {year:"2014 F, 2010 F", marks:"3", repeats:1, q:"Why is simulation tool required?",
   answer:`<h4>Answer</h4>

<p>A simulation <strong>tool</strong> is a software package built specifically for modelling and running simulations. It is required because using a general-purpose language for a simulation means writing the simulation machinery yourself, and that machinery has nothing to do with the system being studied.</p>

<h4>Why a simulation tool is required</h4>

<ol>

<li><strong>It removes the need to program the simulation engine.</strong> The event list, the timing routine, the random-number generator and the statistical counters are all provided; the modeller writes only the logic of the system.</li>

<li><strong>It provides built-in random-number generation and input modelling.</strong> Uniform, exponential, normal, Erlang and empirical distributions can be sampled in one statement, and the generators can be tested and seeded — a major source of error when done by hand.</li>

<li><strong>It collects statistics automatically.</strong> Queue lengths, waiting times, utilisations and their time-averages are accumulated without any extra coding, which is exactly the output the study exists to produce.</li>

<li><strong>It gives standard model components.</strong> Servers, queues, conveyors, tanks and resources are ready-made, so the model is assembled rather than invented, and it looks like other models in the field.</li>

<li><strong>It makes the model easier to verify and validate.</strong> Standard components have standard behaviour, and animation lets the modeller <em>see</em> whether customers, transactions or levels behave as intended.</li>

<li><strong>It is far faster to develop.</strong> A model that takes days to code in C takes hours in GPSS, Arena or Simulink, so experiments can be repeated and the design space explored instead of stopping at one run.</li>

<li><strong>It handles complexity that analytical methods and hand computation cannot</strong> — non-exponential distributions, priorities, breakdowns, finite buffers and hundreds of interacting entities.</li>

<li><strong>It is cheaper and safer than experimenting on the real system.</strong> No plant time is lost, no customer is inconvenienced and no aircraft has to be crashed to find the answers.</li>

<li><strong>It supports later reuse and communication.</strong> The model, its assumptions and its documentation live in one place, and the results can be shared through animation, tables and reports.</li>

</ol>

<p><strong>The cost side, for balance:</strong> a tool imposes its own modelling view (GPSS forces process interaction, a CSSL forces differential equations), some tools are expensive or restrictive, and learning the tool is itself a project. On this course the tool used is <strong>GPSS</strong> for discrete-event models and <strong>CSMP / CSSL</strong> for continuous models.</p>`},
  {year:"2012 C", marks:"5", repeats:1, q:"Design a simulation model of any discrete system in GPSS symbols",
   answer:`<h4>Answer</h4>

<p>A single-server queuing system is the standard "design any discrete system in GPSS symbols" answer. Take a <strong>petrol pump at a filling station</strong>: cars arrive, wait in one line, are served by one pump, and leave.</p>

<h4>GPSS symbols used</h4>

<table class="comparison-table">

<tr><th>Block</th><th>Symbol</th><th>Meaning</th></tr>

<tr><td>GENERATE</td><td>Semicircle (flat side down)</td><td>Creates transactions (arrivals)</td></tr>

<tr><td>QUEUE</td><td>Rectangle, joined to SEIZE edge</td><td>Places the transaction in a named queue and starts recording queue statistics</td></tr>

<tr><td>SEIZE</td><td>Rectangle with a notch on the LEFT edge</td><td>Captures a facility; the transaction waits here if it is busy</td></tr>

<tr><td>DEPART</td><td>Rectangle, joined to RELEASE edge</td><td>Removes the transaction from the queue (stop timing the wait)</td></tr>

<tr><td>ADVANCE</td><td>Rectangle</td><td>Delays the transaction for a sampled service time</td></tr>

<tr><td>RELEASE</td><td>Rectangle with a notch on the RIGHT edge</td><td>Frees the facility</td></tr>

<tr><td>TRANSFER</td><td>Diamond</td><td>Routes the transaction, e.g. accept / reject</td></tr>

<tr><td>TERMINATE</td><td>Circle</td><td>Destroys the transaction and decrements the termination counter</td></tr>

</table>

<h4>Block diagram of the model</h4>

<div class="code-block">   &#9661;  GENERATE 8,3        ; cars arrive every 8 &#177; 3 minutes

   &#9634;  QUEUE    PUMPQ       ; join the queue at the pump

   &#9634;  SEIZE    PUMP        ; capture the pump (waits here if busy)

   &#9634;  DEPART   PUMPQ       ; leave the queue &#8594; the wait is timed

   &#9634;  ADVANCE  6,2         ; refuelling and payment take 6 &#177; 2 minutes

   &#9634;  RELEASE  PUMP        ; free the pump for the next car

&#9671;  TRANSFER ,DONE        ; (add routing here if the model has two exits)

   &#9675;  TERMINATE 1          ; the car leaves the station



   START 200             ; simulate 200 cars</div>

<ol>

<li><strong>GENERATE 8,3</strong> creates one car transaction every 8 &#177; 3 minutes (uniform). The first car enters at time 8.</li>

<li><strong>QUEUE PUMPQ</strong> and <strong>SEIZE PUMP</strong> together implement the queue discipline: a car joins the line and then tries to capture the pump. If the pump is free the capture succeeds immediately and the car passes on; if not, the transaction is held at SEIZE while the pump is busy.</li>

<li><strong>DEPART PUMPQ</strong> is placed <em>after</em> SEIZE deliberately: the car stops being counted as waiting at the instant it captures the pump, so the recorded waiting time is the true queue wait.</li>

<li><strong>ADVANCE 6,2</strong> is the service time — the model of the pump itself.</li>

<li><strong>RELEASE PUMP</strong> frees the facility, and the next car in the queue is allowed through automatically.</li>

<li><strong>TERMINATE 1</strong> destroys the car; <strong>START 200</strong> stops the run when 200 cars have terminated.</li>

</ol>

<h4>Output the run produces</h4>

<ul>

<li><strong>PUMP:</strong> utilisation (fraction of time busy), total number of entries, average time per transaction.</li>

<li><strong>PUMPQ:</strong> maximum queue length, average queue length, average waiting time, and the number of transactions that waited zero time.</li>

<li><strong>Counts:</strong> transactions created, terminated and remaining.</li>

</ul>

<p><strong>Design question the model answers:</strong> with arrivals every 8 minutes and a service time of 6 minutes, the offered load is &#961; = 6/8 = 0.75, so the pump is workable but queues will form; the simulation quantifies the average wait and tells whether a second pump is justified. If it is, the same diagram is changed in one line — <strong>SEIZE</strong> is replaced by <strong>ENTER/LEAVE</strong> on a <em>storage</em> of capacity 2, and the single facility becomes a multi-server station.</p>`},
  {year:"2011 F", marks:"10", repeats:1, q:"What do you mean by distributed lag model? Explain.", occ:[{year:"2010 C", marks:"7", q:"Explain distributed lag model"}],
   answer:`<h4>Answer</h4>
<p>A <strong>distributed lag model</strong> is a model where the output at any time depends not only on the current input but also on <strong>past inputs</strong>. The effect of an input is "distributed" over several time periods.</p>
<div class="formula-box">Y(t) = w₀X(t) + w₁X(t-1) + w₂X(t-2) + ... + wₖX(t-k) = Σᵢ₌₀ᵏ wᵢ × X(t-i)</div>
<p>where:</p>
<ul>
<li>Y(t) = output at time t</li>
<li>X(t-i) = input at time (t-i)</li>
<li>wᵢ = weight (lag coefficient) for the i-th lag</li>
<li>k = maximum lag</li>
</ul>
<h4>Applications</h4>
<ul>
<li><strong>Economics:</strong> Effect of investment on GDP takes multiple quarters to fully materialize</li>
<li><strong>Engineering:</strong> Thermal systems where temperature change lags behind heat input</li>
<li><strong>Marketing:</strong> Advertising effect on sales persists over multiple periods</li>
</ul>
<h4>Example</h4>
<p>If investment at time t affects GDP at t, t+1, and t+2 with weights 0.5, 0.3, 0.2:</p>
<p>GDP(t) = 0.5×Investment(t) + 0.3×Investment(t-1) + 0.2×Investment(t-2)</p>
<p>The total effect of one unit of investment = 0.5+0.3+0.2 = 1.0 (spread over 3 periods).</p>`},
  {year:"2011 C", marks:"2", repeats:1, q:"Show the GPSS block diagram to represent soap quality testing system",
   answer:`<h4>Answer</h4>

<p>In a soap quality-testing system each manufactured bar of soap is taken from the production line, tested for weight, hardness and lather, and either accepted or rejected. The model is a single-server inspection station with two exits.</p>

<div class="code-block">   &#9661;  GENERATE 30,10        ; a soap bar arrives every 30 &#177; 10 minutes

   &#9634;  QUEUE    TESTQ        ; join the testing queue

   &#9634;  SEIZE    TESTER       ; capture the quality tester

   &#9634;  DEPART   TESTQ        ; leave the queue

   &#9634;  ADVANCE  12,3         ; testing one bar takes 12 &#177; 3 minutes

   &#9634;  RELEASE  TESTER       ; free the tester

&#9671;  TRANSFER 0.90,,REJECT    ; 90 % pass &#8594; continue, 10 % go to REJECT

&#9675;  TERMINATE 1            ; ACCEPTED bars leave the system



REJECT&#9675;  TERMINATE 2      ; REJECTED bars leave and are counted separately



   START 500                 ; run until 500 bars have been tested</div>

<table class="comparison-table">

<tr><th>Block</th><th>Role in the soap-testing model</th></tr>

<tr><td>GENERATE 30,10</td><td>Soap bars entering the test station from the production line</td></tr>

<tr><td>QUEUE / DEPART TESTQ</td><td>Queue statistics for bars waiting to be tested, and their waiting time</td></tr>

<tr><td>SEIZE / RELEASE TESTER</td><td>The single quality tester acting as a facility</td></tr>

<tr><td>ADVANCE 12,3</td><td>Inspection time of one bar</td></tr>

<tr><td>TRANSFER 0.90,,REJECT</td><td>Splits the flow randomly: 90 % accepted, 10 % routed to the REJECT label</td></tr>

<tr><td>TERMINATE 1 / TERMINATE 2</td><td>Two exit counters, so accepted and rejected bars are reported separately</td></tr>

</table>

<p><strong>Statements to write with the diagram:</strong> <strong>START 500</strong> (terminate the run after 500 bars), <strong>RESET</strong> (clear statistics and continue), <strong>CLEAR</strong> (reset the whole simulation to its initial state), <strong>SIMULATE</strong> (the model is a simulation program) and <strong>END</strong> (end of the source file). The two TERMINATE blocks together give the acceptance and rejection rates directly from the run output — which is the quality measure the system exists to report.</p>`},
  {year:"2011 F", marks:"6", repeats:1, q:"Discuss SIMSCRIPT and GPSS language in brief",
   answer:`<h4>Answer</h4>

<h4>GPSS — General Purpose Simulation System</h4>

<ul>

<li><strong>Origin and nature:</strong> developed by Geoffrey Gordon at IBM, 1961; a <strong>block-oriented, process-interaction</strong> language for discrete-event simulation.</li>

<li><strong>Modelling idea:</strong> temporary entities called <strong>transactions</strong> flow through an interconnected set of <strong>blocks</strong>; permanent entities are <strong>facilities</strong> (one server) and <strong>storages</strong> (many servers).</li>

<li><strong>Program structure:</strong> a sequence of block statements — GENERATE, QUEUE, SEIZE, DEPART, ADVANCE, RELEASE, TRANSFER, TERMINATE — followed by control statements such as START, RESET, CLEAR, SIMULATE and END.</li>

<li><strong>Automatic features:</strong> event scheduling (next-event time advance), random-number generation, queue statistics, utilisation, transaction counts. The modeller writes no timing logic at all.</li>

<li><strong>Strengths:</strong> extremely quick to learn, very short models, self-documenting block diagram, ideal for queuing, manufacturing, transport and service systems.</li>

<li><strong>Limitations:</strong> the block diagram forces the process-interaction view; awkward for models that need complex logic or unusual data structures; the code-oriented versions were superseded by graphical successors (GPSS/H, GPSS World, Arena).</li>

</ul>

<h4>SIMSCRIPT — Simulation Scriptor</h4>

<ul>

<li><strong>Origin and nature:</strong> developed at RAND Corporation (Harry Markowitz and others, 1963) and later SIMSCRIPT II.5; a <strong>statement-oriented, FORTRAN-like</strong> language embodying <em>event scheduling</em> and also supporting process interaction.</li>

<li><strong>Modelling idea:</strong> the model is expressed in terms of <strong>entities</strong> with <strong>attributes</strong> and <strong>sets</strong>, and the simulation is written as a set of <strong>event routines</strong>. The language "knows" about time, so events are scheduled with statements such as "the event ARRIVAL occurs in 5 minutes".</li>

<li><strong>Program structure — three parts:</strong>

  <ol><li><strong>Preamble:</strong> all declarations — entities, attributes, sets, variables, distributions.</li><li><strong>Main program:</strong> initialization, reading of input, definition of the first events, and the call to start the simulation.</li><li><strong>Event routines:</strong> one routine per event type, each describing what happens when that event occurs and scheduling the events that follow.</li></ol></li>

<li><strong>Features:</strong> English-like free-form statements, built-in random sampling and statistical collection, list-processing for sets, and the ability to interrupt, activate and hold processes.</li>

<li><strong>Strengths:</strong> handles large, complex models, custom disciplines and flexible experimentation; a model can be changed more freely than in GPSS because it is not tied to a fixed block set.</li>

<li><strong>Limitations:</strong> much steeper learning curve than GPSS; verbose; models are longer and the block diagram of the system is no longer the program, which makes verification harder.</li>

</ul>

<h4>Comparison at a glance</h4>

<table class="comparison-table">

<tr><th>Point</th><th>GPSS</th><th>SIMSCRIPT</th></tr>

<tr><td>Orientation</td><td>Process interaction</td><td>Event scheduling (and process)</td></tr>

<tr><td>Form of program</td><td>Block diagram statements</td><td>General statements, FORTRAN-like</td></tr>

<tr><td>Structure</td><td>Blocks + control cards</td><td>Preamble / Main / Event routines</td></tr>

<tr><td>Level</td><td>High — the flow chart <em>is</em> the program</td><td>Lower — the logic is written out</td></tr>

<tr><td>Learning effort</td><td>Small</td><td>Large</td></tr>

<tr><td>Best for</td><td>Queuing, manufacturing, transport</td><td>Large models, custom policies, experimentation</td></tr>

</table>

<p><strong>Which to choose in an exam answer:</strong> GPSS when the system is naturally a flow of objects through resources and the model must be built quickly; SIMSCRIPT when the logic is unusual enough that a block diagram cannot express it.</p>`},
  {year:"2010 C", marks:"5", repeats:1, q:"CSSL (Short Note)",
   answer:`<h4>Answer</h4>
<p><strong>CSSL (Continuous System Simulation Language)</strong> is a family of languages designed for continuous system simulation using differential equations.</p>
<p><strong>Examples:</strong> CSMP (Continuous System Modeling Program), CSSL-IV, ACSL</p>
<p><strong>Program Structure:</strong></p>
<ul>
<li><strong>INITIAL Section:</strong> Set initial values, define parameters and constants</li>
<li><strong>DYNAMIC Section:</strong> Define the differential equations and system behavior. Uses INTGRL function for integration.</li>
<li><strong>TERMINAL Section:</strong> Post-simulation calculations, output results</li>
</ul>
<p><strong>Key Features:</strong></p>
<ul>
<li>Uses differential equations to describe system behavior</li>
<li>Automatic numerical integration (Euler, Runge-Kutta methods)</li>
<li>Suitable for systems like heat transfer, fluid flow, mechanical vibrations</li>
<li>Provides plotting and tabulation of results</li>
</ul>
<p><strong>Example:</strong> For dx/dt = -2x, x(0) = 10:</p>
<p>INITIAL: X = 10.0</p>
<p>DYNAMIC: XDOT = -2.0*X; X = INTGRL(10.0, XDOT)</p>
<p>TERMINAL: PRINT X</p>`},
  {year:"2010 F", marks:"10", repeats:1, q:"Explain Discrete Simulation Language. Explain SIMSCRIPT system concepts and program organization.",
   answer:`<h4>Answer</h4>
<h4>Discrete Simulation Languages</h4>
<p>Languages designed specifically for discrete-event simulation where state changes at discrete time points. They provide built-in event scheduling, entity management, and statistical collection.</p>
<p><strong>Examples:</strong> GPSS, SIMSCRIPT, SLAM II, SIMAN</p>
<h4>SIMSCRIPT</h4>
<p>An event-oriented discrete simulation language developed at RAND Corporation.</p>
<p><strong>System Concepts:</strong></p>
<ul>
<li><strong>Entities:</strong> Objects in the system
  <ul>
  <li><em>Permanent entities:</em> Exist throughout simulation (servers, machines)</li>
  <li><em>Temporary entities:</em> Created and destroyed (customers, jobs)</li>
  </ul>
</li>
<li><strong>Attributes:</strong> Properties of entities (arrival time, priority, service time)</li>
<li><strong>Sets:</strong> Collections of entities ordered by some rule (like queues — FIFO, LIFO, ranked)</li>
</ul>
<p><strong>Program Organization:</strong></p>
<table>
<tr><th>Section</th><th>Purpose</th></tr>
<tr><td><strong>Preamble</strong></td><td>Declarations — define all entities, attributes, sets, and event types. Describes system structure.</td></tr>
<tr><td><strong>Main</strong></td><td>Initialization — create permanent entities, set initial values, schedule first events, start simulation</td></tr>
<tr><td><strong>Event Routines</strong></td><td>Define processing logic for each event type. When an event occurs, its routine is called to update system state.</td></tr>
</table>
<p><strong>Advantages:</strong> English-like syntax, flexible entity management, powerful set operations, built-in statistics.</p>`},
  {year:"2010 C", marks:"2+8", repeats:1, q:"Define state descriptor and discrete event. How do you simulate a telephone system, explain with its states", occ:[{year:"2010 C", marks:"2+8", q:"Define state descriptor and discrete event. How do you simulate a .telephone system, explain with its states"}],
   answer:`<h4>Answer</h4>

<h4>Definitions (2 marks)</h4>

<p><strong>State descriptor:</strong> the collection of all the variables that together describe the system completely at a given instant of time. If two systems have the same state descriptor value they are, for the purpose of the model, in the same condition, and the future of the model depends on the past only through the descriptor. (It is called the <em>state vector</em> or <em>system state</em> in most texts.)</p>

<p><strong>Discrete event:</strong> an instantaneous occurrence that changes the state of the system. Because it is instantaneous, no time elapses while it happens; the simulation clock jumps from one event time to the next. Typical events are an arrival, a service completion, a breakdown and a repair.</p>

<h4>Simulating a telephone system (8 marks)</h4>

<p><strong>System.</strong> A telephone exchange has <strong>N outgoing trunk lines</strong> (this is the model of a <em>lost-call</em> system, the classic Erlang loss system). Calls arrive at random, a call is connected to any free line, and a call lasts a random length of time. If <strong>all N lines are busy when a call arrives the call is lost</strong> — the caller hears the engaged tone and does not wait.</p>

<p><strong>Assumptions:</strong> arrivals are Poisson with mean rate &#955; (inter-arrival times exponential with mean 1/&#955;); call durations are exponential with mean 1/&#956; (so the offered traffic is A = &#955;/&#956; Erlangs); the lines are identical and independent; lost calls do not return.</p>

<h4>1. State descriptor of the telephone system</h4>

<div class="formula-box"><span class="fb-label">State descriptor</span>

S(t) = { t, &nbsp;n(t), &nbsp;{remaining holding time of each busy line}, &nbsp;time of the next arrival }

n(t) = number of lines busy at time t,&nbsp;&nbsp;n = 0, 1, 2, &#8230;, N</div>

<p>The essential part is <strong>n(t), the number of busy lines</strong>; the remaining holding times are needed to schedule the next completion. This is the state descriptor of a <em>birth&#8211;death process</em>: the number of busy lines can go up by one on an arrival and down by one on a completion, and cannot skip values.</p>

<h4>2. The states of the system and the transitions</h4>

<table class="comparison-table">

<tr><th>State</th><th>Meaning</th><th>Transition on an arrival</th><th>Transition on a completion</th></tr>

<tr><td>0</td><td>All N lines free, exchange idle</td><td>0 &#8594; 1 (call connected)</td><td>cannot occur</td></tr>

<tr><td>1 &#8230; N&#8722;1</td><td>Some lines busy, at least one free</td><td>n &#8594; n+1, call connected</td><td>n &#8594; n&#8722;1</td></tr>

<tr><td><strong>N</strong></td><td><strong>All lines busy — the blocking state</strong></td><td>call is <strong>blocked and lost</strong>, n stays N</td><td>N &#8594; N&#8722;1</td></tr>

</table>

<div class="formula-box"><span class="fb-label">Birth&#8211;death rates</span>

Arrival rate in state n &lt; N: &nbsp;&#955;&#8345; = &#955;&nbsp;&nbsp;&nbsp;&#183;&nbsp;&nbsp;&nbsp;Arrival rate in state N: &nbsp;&#955;&#8345; = 0 (calls are lost)

Completion rate in state n &gt; 0: &nbsp;&#956;&#8345; = n&#956;&nbsp;&nbsp;&nbsp;(&#956; = 1 / mean call duration)</div>

<h4>3. Event routines of the simulation</h4>

<div class="code-block">EVENT: ARRIVAL (a call reaches the exchange)

1. Schedule the next arrival:  ARRIVAL at  clock + sample(exponential with mean 1/&#955;)

2. If n &lt; N :                       ; a line is free

      n = n + 1                     ; connect the call

      schedule COMPLETION at clock + sample(exponential with mean 1/&#956;)

   else:                            ; blocking state

      blocked = blocked + 1         ; the call is lost, no line is taken

3. Update the area under n(t) for the utilisation statistics



EVENT: COMPLETION (a call ends, one line becomes free)

1. n = n - 1                        ; free the line

2. completed = completed + 1

3. Update the area under n(t) and the holding-time statistics</div>

<h4>4. Flow of control and collected statistics</h4>

<ol>

<li>Initialization: t = 0, n = 0, counters = 0, first ARRIVAL scheduled, the event list holds only that event.</li>

<li>Timing routine takes the smallest event time and the clock jumps to it.</li>

<li>The event routine above is executed, changing the state descriptor and scheduling the following event.</li>

<li>The loop repeats until the planned number of arrivals (or a fixed closing time) is reached, then the report generator runs.</li>

<li><strong>Statistics produced:</strong> probability that a call is blocked = blocked/total arrivals (this is the Erlang loss probability B(N, A), the quantity a telephone engineer actually wants); line utilisation = (time-average of n)/N; average number of calls in progress; and the distribution of the number of busy lines.</li>

</ol>

<div class="worked">

<div class="worked-head"><span>Illustration with a very small exchange</span><span class="meta">N = 2 lines, &#955; = 3 calls/hour, mean call 20 min</span></div>

<div class="worked-givens">

<div><span>Lines</span><b>N = 2</b></div>

<div><span>Call arrival rate</span><b>&#955; = 3 per hour</b></div>

<div><span>Mean holding time</span><b>1/&#956; = 20 min = 1/3 h</b></div>

</div>

<ol class="worked-steps">

<li><span class="worked-calc">Offered traffic A = &#955;/&#956; = 3 &#215; (1/3) = 1 Erlang</span><span class="worked-note">One Erlang means the lines are, on average, busy for one full line's worth of time.</span></li>

<li><span class="worked-calc">Erlang loss formula for N = 2, A = 1 (the theoretical check of the simulation):

B = (A&#178;/2) / (1 + A + A&#178;/2) = 0.5 / 2.5 = <strong>0.20</strong></span></li>

<li><span class="worked-calc">A simulation of 1000 calls should therefore show about 200 calls blocked and about 800 connected, with each of the two lines busy roughly (1 &#8722; 0.20)/2 &#215; 100 % &#8776; 40 % of the time — the numbers the run output is compared against.</span><span class="worked-note">This comparison is the validation of the simulation model, not part of the simulation itself.</span></li>

</ol>

<p class="worked-result">P(call blocked) &#8776; 20 % for 2 lines carrying 1 Erlang. Adding a third line lowers it to about 6 %, which is exactly the design question the model is used to answer.</p>

</div>

<p><strong>Where the model extends:</strong> if callers are made to wait instead of being lost (a queuing, not a loss, system) the state descriptor is unchanged but the ARRIVAL routine must place the call in a queue and the COMPLETION routine must serve the first waiting call; if callers <em>retry</em> after being blocked, the arrival process becomes dependent on the blocking history and the model becomes far richer.</p>`}
]
};
