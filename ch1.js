window.CHAPTERS = window.CHAPTERS || {};
window.CHAPTERS[1] = {
learn: `
<h2>1.1 Introduction to Simulation</h2>
<p><strong>Simulation</strong> is the imitation of the operation of a real-world process or system over time. It involves designing a model of a real system and conducting experiments with this model to understand its behavior or evaluate strategies for its operation.</p>
<div class="concept-box">
<h4>Key Formula</h4>
<p><strong>Simulation = Model + Experimentation</strong></p>
<p>The process of creating a model for simulation is known as <em>modeling</em>.</p>
</div>
<p><strong>Purpose of Simulation:</strong></p>
<ul>
<li>To reduce failure and meet specifications</li>
<li>To prevent under and over-utilization of resources</li>
<li>To eliminate unforeseen bottlenecks</li>
<li>To optimize system performance</li>
</ul>
<p><strong>History of Simulation:</strong></p>
<ul>
<li><strong>1940s:</strong> Monte Carlo method developed by John Von Neumann (Manhattan Project — neutron scattering)</li>
<li><strong>1960s:</strong> First special-purpose languages (SIMSCRIPT by Harry Markowitz at RAND Corporation)</li>
<li><strong>1970s:</strong> Mathematical foundations of simulation research initiated</li>
<li><strong>1980s:</strong> PC-based simulation software, GUI, and object-oriented programming</li>
<li><strong>1990s:</strong> Web-based simulation, simulation-based optimization, Markov chain methods</li>
</ul>

<h3>Difference between Modeling & Simulation</h3>
<table class="comparison-table">
<tr><th>Modeling</th><th>Simulation</th></tr>
<tr><td>A model is a physical or digital product that represents a system of interest</td><td>A simulation is the process of using a model to study the behavior and performance of a system</td></tr>
<tr><td>A model is similar but simpler than the original system</td><td>Simulation can study existing or proposed characteristics</td></tr>
<tr><td>A good model is a trade-off between realism and simplicity</td><td>Purpose is to study characteristics by manipulating variables</td></tr>
<tr><td>Can be physical (boat model) or conceptual (mathematical model)</td><td>Simulating is the act of using a model for simulation</td></tr>
<tr><td>Modeling is the act of building models</td><td>Results help in decision making</td></tr>
</table>

<h2>1.2 The System</h2>
<p>The term <strong>system</strong> is derived from Greek word <em>"systema"</em> which means an organized relationship of functional units or components. The interaction and interdependence among the objects to fulfill a particular objective is called a system.</p>
<p><strong>Examples:</strong> Transportation System, Telephone System, Production System, Accounting System, Banking System</p>
<div class="concept-box">
<h4>System Concepts</h4>
<p><strong>System Boundary:</strong> Everything within the system is <em>endogenous</em>; everything outside is <em>exogenous</em>.</p>
<p><strong>System Environment:</strong> The external conditions that affect the system.</p>
</div>

<h3>Components of a System</h3>
<table class="comparison-table">
<tr><th>Component</th><th>Definition</th><th>Example (Banking System)</th></tr>
<tr><td><strong>Entity</strong></td><td>An object of interest in the system</td><td>Client, Bank Teller, ATM, Account</td></tr>
<tr><td><strong>Attribute</strong></td><td>A property of an entity</td><td>Name, Account Number, Balance, Teller ID</td></tr>
<tr><td><strong>Activity</strong></td><td>A process causing changes in a system</td><td>Opening account, Depositing amount, Processing loan</td></tr>
<tr><td><strong>State</strong></td><td>Collection of variables necessary to describe the system at any time</td><td>Number of customers waiting, Number of busy tellers</td></tr>
<tr><td><strong>Event</strong></td><td>An instantaneous occurrence that changes the state</td><td>Arrival of customer, Completion of service</td></tr>
</table>

<h3>Types of Events</h3>
<ul>
<li><strong>Endogenous Events:</strong> Events occurring within the system (e.g., completion of service)</li>
<li><strong>Exogenous Events:</strong> Events occurring in the environment that affect the system (e.g., arrival of customer)</li>
</ul>

<div class="example-box">
<h4>Example: Banking System</h4>
<p><strong>Entities:</strong> Client, Bank Teller, ATM, Account</p>
<p><strong>Attributes:</strong> Name, Transaction History, Account Number, Balance, Teller ID, Service Time</p>
<p><strong>Activities:</strong> Opening account, Depositing, Transfer, Processing loan</p>
<p><strong>Events:</strong> Customer arrival (exogenous), Service completion (endogenous)</p>
<p><strong>State Variables:</strong> Number of registered clients, Customers waiting in line, Busy tellers</p>
</div>

<h3>Types of Systems</h3>
<ul>
<li><strong>Endogenous System:</strong> Activities and events occurring within a system (e.g., withdrawing cash)</li>
<li><strong>Exogenous System:</strong> Activities and events in the environment that affect the system (e.g., arrival of customer, strike)</li>
<li><strong>Closed System:</strong> No exogenous activity/events (e.g., water in an insulated flask)</li>
<li><strong>Open System:</strong> Has exogenous activities/events (e.g., bank system)</li>
</ul>

<h2>1.3 Continuous vs Discrete Systems</h2>
<table class="comparison-table">
<tr><th>Feature</th><th>Continuous System</th><th>Discrete System</th></tr>
<tr><td><strong>State changes</strong></td><td>Predominantly smooth/continuous</td><td>Predominantly discontinuous (at discrete points)</td></tr>
<tr><td><strong>Mathematical model</strong></td><td>Differential equations</td><td>Event-driven logic</td></tr>
<tr><td><strong>Example</strong></td><td>Head of water behind a dam, aircraft movement</td><td>Customer arriving at bank, inventory changes</td></tr>
<tr><td><strong>Simulation clock</strong></td><td>Advances continuously</td><td>Advances in steps/events</td></tr>
<tr><td><strong>Simulation language</strong></td><td>CSSL, MATLAB/Simulink</td><td>GPSS, SIMSCRIPT, Arena</td></tr>
</table>

<h2>1.4 Deterministic vs Stochastic Systems</h2>
<table class="comparison-table">
<tr><th>Feature</th><th>Deterministic System</th><th>Stochastic System</th></tr>
<tr><td><strong>Random elements</strong></td><td>No random elements, no uncertainty</td><td>One or more random elements</td></tr>
<tr><td><strong>Output</strong></td><td>Single & predictable output for given inputs</td><td>Range of possible outcomes, different each run</td></tr>
<tr><td><strong>Example</strong></td><td>P(t) = P₀eʳᵗ (Population growth), F = ma (Newton's law)</td><td>Stock market model (depends on investor behavior, economic indicators)</td></tr>
</table>

<h2>1.5 Real-Time Simulation</h2>
<p>Real-time simulation means the model runs at the <strong>same speed</strong> as the actual system. The simulation clock advances in real-world time.</p>
<div class="concept-box tip">
<h4>Applications</h4>
<p>Flight simulators, military training, vehicle testing, hardware-in-the-loop simulations, medical procedure training.</p>
</div>

<h2>1.6 When to Use Simulation</h2>
<h3>When Simulation IS Appropriate:</h3>
<ol>
<li>To address dynamic processes</li>
<li>To analyze the effect of alterations on model behavior</li>
<li>To determine the most important variables by changing inputs and observing outputs</li>
<li>To verify the analytical solution</li>
<li>To experiment new designs before actual implementation</li>
</ol>
<h3>When Simulation is NOT Appropriate:</h3>
<ol>
<li>When the problem can be solved by common sense</li>
<li>If the problem can be solved analytically</li>
<li>Easier to perform direct implementation</li>
<li>Cost exceeds the savings</li>
<li>Resources and time are not available</li>
<li>No data is available</li>
</ol>

<h2>1.7 Types of Simulation Models</h2>
<table class="comparison-table">
<tr><th>Classification Basis</th><th>Types</th></tr>
<tr><td>Nature of output</td><td>Deterministic / Stochastic</td></tr>
<tr><td>Time change</td><td>Continuous / Discrete</td></tr>
<tr><td>Time dependency</td><td>Static / Dynamic</td></tr>
<tr><td>Scale</td><td>Physical / Mathematical</td></tr>
<tr><td>Methodology</td><td>Monte Carlo / Discrete Event / Continuous</td></tr>
</table>

<h3>Model Classification Tree</h3>
<p><strong>Model → Physical | Mathematical</strong></p>
<p><strong>Physical:</strong> Scale-Up (for tiny particles like molecules), Scale-Down (for large systems like bridges), Full-Scale (actual size, e.g., crash testing)</p>
<p><strong>Mathematical → Static | Dynamic</strong></p>
<p><strong>Static:</strong> Snapshot at a particular moment (e.g., supply-demand models)</p>
<p><strong>Dynamic:</strong> Evolves over time, represented by differential equations (e.g., population growth)</p>
<p><strong>Mathematical → Analytical | Numerical</strong></p>
<p><strong>Analytical:</strong> Exact mathematical expressions (may be difficult for complex systems)</p>
<p><strong>Numerical:</strong> Computational methods to approximate solutions (System Simulation)</p>

<h2>1.8 Steps in Simulation Study</h2>
<div class="concept-box important">
<h4>12 Steps in Simulation Study (Very Important for Exams)</h4>
<p>This topic is asked in almost every exam paper!</p>
</div>
<ol>
<li><strong>Problem Formulation:</strong> Clearly state the problem</li>
<li><strong>Setting Objectives & Overall Plan:</strong> How to approach the problem</li>
<li><strong>Model Conceptualization:</strong> Establish a reasonable model</li>
<li><strong>Data Collection:</strong> Collect necessary data (arrival process, service discipline, service rate)</li>
<li><strong>Model Translation:</strong> Convert the model into a programming language</li>
<li><strong>Verification:</strong> Verify whether the model works properly or not</li>
<li><strong>Validation:</strong> Check if the system accurately represents the real system</li>
<li><strong>Experimental Design:</strong> How many runs, how long, what kind of inputs</li>
<li><strong>Production Run & Analysis:</strong> Actual running of the simulation model, collect & analyze output</li>
<li><strong>More Runs:</strong> Repeat the experiment if necessary</li>
<li><strong>Documentation & Reporting:</strong> Document the results & report to stakeholders</li>
<li><strong>Implementation:</strong> Implement the actual model</li>
</ol>

<h3>Flowchart of the simulation study</h3>

<p>The twelve steps in one picture — draw this in the answer, then label the two loops. The <em>verification and validation</em> loop is what makes it a simulation study and not a straight line, and the <em>more runs</em> loop is what turns one experiment into a statistically usable result.</p>

<figure class="figure-wrap">

<svg class="figure" viewBox="0 0 640 934" role="img" aria-label="Flowchart of the twelve steps of a simulation study, with verification and validation loops back to the model">

<defs><marker id="fx" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="flow-arrow-head"/></marker></defs>

<rect class="flow-box flow-box phase1" x="92" y="22" width="456" height="46" rx="10"/>

<text class="flow-text" x="320.0" y="50.0">1  Problem formulation</text>

<path class="flow-arrow" d="M320.0,68 V91" marker-end="url(#fx)"/>

<rect class="flow-box flow-box phase1" x="92" y="94" width="456" height="46" rx="10"/>

<text class="flow-text" x="320.0" y="122.0">2  Setting objectives & overall plan</text>

<path class="flow-arrow" d="M320.0,140 V163" marker-end="url(#fx)"/>

<rect class="flow-box flow-box phase1" x="92" y="166" width="456" height="46" rx="10"/>

<text class="flow-text" x="320.0" y="194.0">3  Model conceptualization</text>

<path class="flow-arrow" d="M320.0,212 V235" marker-end="url(#fx)"/>

<rect class="flow-box flow-box phase1" x="92" y="238" width="456" height="46" rx="10"/>

<text class="flow-text" x="320.0" y="266.0">4  Data collection</text>

<path class="flow-arrow" d="M320.0,284 V307" marker-end="url(#fx)"/>

<rect class="flow-box flow-box phase1" x="92" y="310" width="456" height="46" rx="10"/>

<text class="flow-text" x="320.0" y="338.0">5  Model translation</text>

<path class="flow-arrow" d="M320.0,356 V379" marker-end="url(#fx)"/>

<rect class="flow-box flow-box phase2" x="92" y="382" width="456" height="46" rx="10"/>

<text class="flow-text" x="320.0" y="410.0">6  Verification (does it work?)</text>

<path class="flow-arrow" d="M320.0,428 V451" marker-end="url(#fx)"/>

<rect class="flow-box flow-box phase2" x="92" y="454" width="456" height="46" rx="10"/>

<text class="flow-text" x="320.0" y="482.0">7  Validation (is it the right model?)</text>

<path class="flow-arrow" d="M320.0,500 V523" marker-end="url(#fx)"/>

<rect class="flow-box flow-box phase2" x="92" y="526" width="456" height="46" rx="10"/>

<text class="flow-text" x="320.0" y="554.0">8  Experimental design</text>

<path class="flow-arrow" d="M320.0,572 V595" marker-end="url(#fx)"/>

<rect class="flow-box flow-box phase3" x="92" y="598" width="456" height="46" rx="10"/>

<text class="flow-text" x="320.0" y="626.0">9  Production run & analysis</text>

<path class="flow-arrow" d="M320.0,644 V667" marker-end="url(#fx)"/>

<rect class="flow-box flow-box phase3" x="92" y="670" width="456" height="46" rx="10"/>

<text class="flow-text" x="320.0" y="698.0">10  More runs needed?</text>

<path class="flow-arrow" d="M320.0,716 V739" marker-end="url(#fx)"/>

<rect class="flow-box flow-box phase4" x="92" y="742" width="456" height="46" rx="10"/>

<text class="flow-text" x="320.0" y="770.0">11  Documentation & reporting</text>

<path class="flow-arrow" d="M320.0,788 V811" marker-end="url(#fx)"/>

<rect class="flow-box flow-box phase4" x="92" y="814" width="456" height="46" rx="10"/>

<text class="flow-text" x="320.0" y="842.0">12  Implementation</text>

<path class="flow-loop" d="M92,405.0 H52 V189.0 H89" marker-end="url(#fx)"/>

<text class="flow-label" x="60" y="280.0" transform="rotate(-90 60 280.0)" text-anchor="middle">revise the model</text>

<path class="flow-loop" d="M548,693.0 H604 V549.0 H551" marker-end="url(#fx)"/>

<text class="flow-label" x="596" y="604.0" transform="rotate(90 596 604.0)" text-anchor="middle">re-run with new seeds</text>

</svg>

<figcaption>Fig 1.1 — Steps in a simulation study. Colour marks the four phases of §1.9: problem definition (steps 1–3), translation and data (4–5), verification, validation and design (6–8), analysis to implementation (9–12). <button class="page-chip" type="button" data-page="n1p13">n1 p13</button></figcaption>

</figure>



<h2>1.9 Phases of Simulation Study</h2>
<table class="comparison-table">
<tr><th>Phase</th><th>Name</th><th>Steps Involved</th></tr>
<tr><td><strong>Phase 1</strong></td><td>Problem Definition & Conceptual Modeling</td><td>Steps 1, 2, 3</td></tr>
<tr><td><strong>Phase 2</strong></td><td>Model Translation & Data Collection</td><td>Steps 4, 5</td></tr>
<tr><td><strong>Phase 3</strong></td><td>Verification, Validation & Experimental Design</td><td>Steps 6, 7, 8</td></tr>
<tr><td><strong>Phase 4</strong></td><td>Analysis & Interpretation</td><td>Steps 9, 10, 11, 12</td></tr>
</table>

<h2>1.10 Advantages of Simulation</h2>
<ol>
<li>Useful for <strong>sensitivity analysis</strong> of complex systems</li>
<li>Suitable for analyzing complex real-life problems that cannot be solved using quantitative methods</li>
<li>If remaining tools cannot be used, simulation can be the option</li>
<li>Can be used as a tool for <strong>testing and trying new policies</strong> & decision rules for operating the system</li>
</ol>

<h2>1.11 Limitations of Simulation</h2>
<ol>
<li>Building a model requires <strong>art that is learned through experience</strong></li>
<li>In some cases, results may be <strong>complex to interpret</strong></li>
<li>It may be <strong>time consuming and expensive</strong></li>
</ol>

<h2>1.12 Areas of Application</h2>
<table class="comparison-table">
<tr><th>Area</th><th>Applications</th></tr>
<tr><td><strong>Manufacturing</strong></td><td>Process optimization, design testing, employee training</td></tr>
<tr><td><strong>Healthcare</strong></td><td>Medical procedure training, patient flow management, system design</td></tr>
<tr><td><strong>Transportation</strong></td><td>Traffic management, vehicle design, route optimization</td></tr>
<tr><td><strong>Finance</strong></td><td>Market value prediction, risk analysis, portfolio management</td></tr>
<tr><td><strong>Military</strong></td><td>Combat training, mission planning, strategies development</td></tr>
</table>
`,

quiz: [
  {q:"What is simulation?", options:["Building a physical prototype","Imitation of a real-world process or system over time","Writing computer programs","Collecting data from experiments"], answer:1, explanation:"Simulation is the imitation of the operation of a real-world process or system over time using models."},
  {q:"The term 'system' is derived from which language?", options:["Latin","French","Greek","Sanskrit"], answer:2, explanation:"The term system is derived from the Greek word 'systema' meaning an organized relationship of functional units."},
  {q:"Which of the following is an endogenous event in a banking system?", options:["Arrival of a customer","Power outage","Completion of service for a customer","Government policy change"], answer:2, explanation:"Endogenous events occur within the system. Completion of service is internal to the banking system."},
  {q:"A system with no exogenous activity or events is called?", options:["Open system","Discrete system","Closed system","Stochastic system"], answer:2, explanation:"A closed system has no exogenous activity or events. Example: water in an insulated flask."},
  {q:"Which is an example of a continuous system?", options:["Customer arriving at bank","Head of water behind a dam","Traffic light changes","Inventory system"], answer:1, explanation:"The head of water behind a dam changes smoothly and continuously over time."},
  {q:"A deterministic model produces:", options:["Different output each run","Random output","Same output for given inputs every time","No output"], answer:2, explanation:"Deterministic models have no random elements — they produce the same, predictable output for given inputs."},
  {q:"How many steps are there in a simulation study?", options:["8","10","12","15"], answer:2, explanation:"There are 12 steps: Problem Formulation → Setting Objectives → Model Conceptualization → Data Collection → Model Translation → Verification → Validation → Experimental Design → Production Runs → More Runs → Documentation → Implementation."},
  {q:"Phase 3 of simulation study involves which steps?", options:["Steps 1, 2, 3","Steps 4, 5","Steps 6, 7, 8","Steps 9, 10, 11, 12"], answer:2, explanation:"Phase 3 (Verification, Validation & Experimental Design) involves steps 6, 7, and 8."},
  {q:"Real-time simulation means the model runs at:", options:["Faster than actual system","Slower than actual system","Same speed as actual system","Variable speed"], answer:2, explanation:"Real-time simulation runs at the same speed as the actual system. The simulation clock advances in real-world time."},
  {q:"Which is NOT a limitation of simulation?", options:["Time consuming and expensive","Results may be complex to interpret","Can test new policies without disrupting real system","Requires art learned through experience"], answer:2, explanation:"Testing new policies without disrupting the real system is an ADVANTAGE of simulation, not a limitation."}
],

past: [
  {year:"2025 M", marks:"4", repeats:4, q:"Explain the steps in a simulation study with a flowchart.", occ:[{year:"2019 F", marks:"5", q:"Explain the phases and steps in simulation study"}, {year:"2019 F", marks:"5", q:"Explain the phases and steps in simulation study."}],
   variants:[{year:"2019 F", marks:"5", q:"Explain the phases and steps in simulation study.", answer:`<h4>Answer</h4>
<p><strong>12 Steps in Simulation Study:</strong></p>
<ol>
<li><strong>Problem Formulation:</strong> Clearly state the problem to be solved</li>
<li><strong>Setting Objectives & Plan:</strong> Define how to approach the problem</li>
<li><strong>Model Conceptualization:</strong> Establish a reasonable abstract model</li>
<li><strong>Data Collection:</strong> Collect necessary data (arrival rates, service times, etc.)</li>
<li><strong>Model Translation:</strong> Convert model into programming language (GPSS, SIMSCRIPT)</li>
<li><strong>Verification:</strong> Verify the model works properly (correct I/P → correct O/P)</li>
<li><strong>Validation:</strong> Check if model accurately represents the real system</li>
<li><strong>Experimental Design:</strong> Decide number of runs, duration, input types</li>
<li><strong>Production Run & Analysis:</strong> Run simulation and analyze output</li>
<li><strong>More Runs:</strong> Repeat if necessary for accuracy</li>
<li><strong>Documentation & Reporting:</strong> Document results for stakeholders</li>
<li><strong>Implementation:</strong> Implement the actual model decisions</li>
</ol>
<p><strong>4 Phases:</strong></p>
<table><tr><th>Phase</th><th>Name</th><th>Steps</th></tr>
<tr><td>Phase 1</td><td>Problem Definition & Conceptual Modeling</td><td>Steps 1, 2, 3</td></tr>
<tr><td>Phase 2</td><td>Model Translation & Data Collection</td><td>Steps 4, 5</td></tr>
<tr><td>Phase 3</td><td>Verification, Validation & Experimental Design</td><td>Steps 6, 7, 8</td></tr>
<tr><td>Phase 4</td><td>Analysis & Interpretation</td><td>Steps 9, 10, 11, 12</td></tr></table>`}],
   answer:`<h4>Answer</h4>
<p><strong>The 12 steps of a simulation study</strong> — the figure in the notes draws them as one flowchart. Draw it as the answer, then write the twelve labels and the four phase bands on it:</p>
<figure class="figure-wrap">
<svg class="figure" viewBox="0 0 640 934" role="img" aria-label="Flowchart of the twelve steps of a simulation study, with verification and validation loops back to the model and a more-runs loop back to the experimental design">
<defs><marker id="fx1b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="flow-arrow-head"/></marker></defs>
<rect class="flow-box phase1" x="92" y="22" width="456" height="46" rx="10"/>
<text class="flow-text" x="320.0" y="50.0">1  Problem formulation</text>
<path class="flow-arrow" d="M320.0,68 V91" marker-end="url(#fx1b)"/>
<rect class="flow-box phase1" x="92" y="94" width="456" height="46" rx="10"/>
<text class="flow-text" x="320.0" y="122.0">2  Setting objectives & overall plan</text>
<path class="flow-arrow" d="M320.0,140 V163" marker-end="url(#fx1b)"/>
<rect class="flow-box phase1" x="92" y="166" width="456" height="46" rx="10"/>
<text class="flow-text" x="320.0" y="194.0">3  Model conceptualization</text>
<path class="flow-arrow" d="M320.0,212 V235" marker-end="url(#fx1b)"/>
<rect class="flow-box phase1" x="92" y="238" width="456" height="46" rx="10"/>
<text class="flow-text" x="320.0" y="266.0">4  Data collection</text>
<path class="flow-arrow" d="M320.0,284 V307" marker-end="url(#fx1b)"/>
<rect class="flow-box phase1" x="92" y="310" width="456" height="46" rx="10"/>
<text class="flow-text" x="320.0" y="338.0">5  Model translation</text>
<path class="flow-arrow" d="M320.0,356 V379" marker-end="url(#fx1b)"/>
<rect class="flow-box phase2" x="92" y="382" width="456" height="46" rx="10"/>
<text class="flow-text" x="320.0" y="410.0">6  Verification (does it work?)</text>
<path class="flow-arrow" d="M320.0,428 V451" marker-end="url(#fx1b)"/>
<rect class="flow-box phase2" x="92" y="454" width="456" height="46" rx="10"/>
<text class="flow-text" x="320.0" y="482.0">7  Validation (is it the right model?)</text>
<path class="flow-arrow" d="M320.0,500 V523" marker-end="url(#fx1b)"/>
<rect class="flow-box phase2" x="92" y="526" width="456" height="46" rx="10"/>
<text class="flow-text" x="320.0" y="554.0">8  Experimental design</text>
<path class="flow-arrow" d="M320.0,572 V595" marker-end="url(#fx1b)"/>
<rect class="flow-box phase3" x="92" y="598" width="456" height="46" rx="10"/>
<text class="flow-text" x="320.0" y="626.0">9  Production run & analysis</text>
<path class="flow-arrow" d="M320.0,644 V667" marker-end="url(#fx1b)"/>
<rect class="flow-box phase3" x="92" y="670" width="456" height="46" rx="10"/>
<text class="flow-text" x="320.0" y="698.0">10  More runs needed?</text>
<path class="flow-arrow" d="M320.0,716 V739" marker-end="url(#fx1b)"/>
<rect class="flow-box phase4" x="92" y="742" width="456" height="46" rx="10"/>
<text class="flow-text" x="320.0" y="770.0">11  Documentation & reporting</text>
<path class="flow-arrow" d="M320.0,788 V811" marker-end="url(#fx1b)"/>
<rect class="flow-box phase4" x="92" y="814" width="456" height="46" rx="10"/>
<text class="flow-text" x="320.0" y="842.0">12  Implementation</text>
<path class="flow-loop" d="M92,405.0 H52 V189.0 H89" marker-end="url(#fx1b)"/>
<text class="flow-label" x="60" y="280.0" transform="rotate(-90 60 280.0)" text-anchor="middle">revise the model</text>
<path class="flow-loop" d="M548,693.0 H604 V549.0 H551" marker-end="url(#fx1b)"/>
<text class="flow-label" x="596" y="604.0" transform="rotate(90 596 604.0)" text-anchor="middle">re-run with new seeds</text>
</svg>
<figcaption>Fig 1.1 — Steps in a simulation study. Colour marks the four phases of §1.9: problem definition (steps 1–3), translation and data (4–5), verification, validation and design (6–8), analysis to implementation (9–12). The two dashed returns are the part the marks are really for: a <em>no</em> at verification goes back to model translation, and a <em>no</em> at validation goes back to model conceptualization. <button class="page-chip" type="button" data-page="n1p13">n1 p13</button></figcaption>
</figure>
<ol>
<li><strong>Problem formulation:</strong> state clearly what problem is to be solved.</li>
<li><strong>Setting of objectives &amp; overall plan:</strong> decide what questions the study must answer and how to answer them.</li>
<li><strong>Model conceptualization:</strong> build the abstract model — start simple and add detail only where it is needed.</li>
<li><strong>Data collection:</strong> gather the arrival rates, service times and other inputs.</li>
<li><strong>Model translation:</strong> code the model in a simulation language (GPSS, SIMSCRIPT, Arena).</li>
<li><strong>Verification:</strong> does the program do what we intended? (correct input gives correct output)</li>
<li><strong>Validation:</strong> does the model represent the real system? (compare its behaviour with the actual system)</li>
<li><strong>Experimental design:</strong> how many runs, how long, and which factors to vary.</li>
<li><strong>Production run &amp; analysis:</strong> execute the runs and analyse the output statistically.</li>
<li><strong>More runs?</strong> repeat if more accuracy is required.</li>
<li><strong>Documentation &amp; reporting:</strong> record the model, its assumptions and its results.</li>
<li><strong>Implementation:</strong> apply the findings to the real system.</li>
</ol>
<p><strong>The four phases</strong> into which the steps group:</p>
<table class="comparison-table">
<tr><th>Phase</th><th>Name</th><th>Steps</th></tr>
<tr><td>1</td><td>Problem definition &amp; conceptual modelling</td><td>1, 2, 3</td></tr>
<tr><td>2</td><td>Data collection &amp; model translation</td><td>4, 5</td></tr>
<tr><td>3</td><td>Verification, validation &amp; experimental design</td><td>6, 7, 8</td></tr>
<tr><td>4</td><td>Production runs, analysis &amp; implementation</td><td>9, 10, 11, 12</td></tr>
</table>
<p><strong>The flowchart and its feedback loops.</strong> The steps are drawn as a sequence, but the diagram is not a straight line: a <em>no</em> answer to <strong>verification</strong> sends control back to step 5 (model translation), a <em>no</em> answer to <strong>validation</strong> sends it back to step 3 (model conceptualization), and after analysis step 10 asks "more runs?" and returns to step 8 (experimental design). This iteration is what makes the study trustworthy — no model survives its first contact with the data unchanged, and an exam answer is expected to show the three return arrows, not only the twelve boxes.</p>`},
  {year:"2010 F", marks:"10", repeats:4, q:"Discuss real-time simulation with an example. Mention purposes and limitations of simulation.", occ:[{year:"2011 C", marks:"3+7", q:"Explain real time simulation with example? Explain the type of simulation models"}, {year:"2010 F", marks:"4+3+3", q:"Discuss real-time simulation with an example. Mention purposes of using simulation. What are the limitations of simulation?"}, {year:"2010 F", marks:"3+3", q:"Mention purposes of using simulation. What are the limitations of simulation?"}, {year:"2010 C", marks:"5", q:"Explain the limitations of Simulation Techniques"}],
   answer:`<h4>Answer</h4>
<p><strong>Real-Time Simulation:</strong> The model runs at the same speed as the actual system. The simulation clock advances in real-world time.</p>
<p><strong>Example — Flight Simulator:</strong> A flight simulator creates a virtual cockpit with realistic controls, instruments, and visual displays. When a pilot moves the control stick, the simulated aircraft responds in real-time. Weather conditions, engine failures, and emergencies can be simulated to train pilots safely. The simulation must process inputs and update outputs at the same rate as a real aircraft.</p>
<h4>Purposes of Simulation</h4>
<ol>
<li>To reduce failure and meet specifications</li>
<li>To prevent under/over-utilization of resources</li>
<li>To eliminate unforeseen bottlenecks</li>
<li>To optimize system performance</li>
<li>To test new designs before implementation</li>
</ol>
<h4>Limitations</h4>
<ol>
<li>Requires art and experience to build good models</li>
<li>Results may be difficult to interpret</li>
<li>Can be time consuming and expensive</li>
<li>May not produce exact answers — only estimates</li>
</ol>`},
  {year:"2019 F", marks:"5", repeats:3, q:"Explain the concept of System. Differentiate between Continuous and Discrete, Deterministic and Stochastic system with example.", occ:[{year:"2019 F", marks:"5", q:"Explain the concept of System. Differentiate between Continuous and discrete, Deterministic and Stochastic system with example"}],
   answer:`<h4>Answer</h4>
<p><strong>System:</strong> A system (from Greek 'systema') is a group of objects joined together in regular interaction or interdependence toward the accomplishment of some purpose. It consists of entities, attributes, activities, events, and state variables.</p>
<p><strong>Example:</strong> A banking system consists of customers, tellers, ATMs, and accounts — all interacting to provide banking services.</p>
<h4>Continuous vs Discrete System</h4>
<table><tr><th>Continuous System</th><th>Discrete System</th></tr>
<tr><td>State changes are predominantly smooth</td><td>State changes are predominantly discontinuous</td></tr>
<tr><td>Modeled by differential equations</td><td>Modeled by event-driven logic</td></tr>
<tr><td>Example: Head of water behind a dam changes smoothly</td><td>Example: Number of customers in bank changes at discrete points</td></tr></table>
<h4>Deterministic vs Stochastic System</h4>
<table><tr><th>Deterministic System</th><th>Stochastic System</th></tr>
<tr><td>No random elements, no uncertainty</td><td>One or more random elements</td></tr>
<tr><td>Same output for same inputs every time</td><td>Different output for same inputs each run</td></tr>
<tr><td>Example: P(t) = P₀eʳᵗ (population growth), F = ma</td><td>Example: Stock market model (depends on investor behavior, economic indicators)</td></tr></table>`},
  {year:"2014 F", marks:"10", repeats:3, q:"Explain the ways to study a system. What are the criteria of classifying Simulation models? Brief it with suitable example.", occ:[{year:"2014 F", marks:"3+7", q:"Explain the ways to study a system. What are tpe criteria of classifying Simulation models? Brief it with suitable example"}, {year:"2014 F", marks:"7", q:"What are the criteria of classifying Simulation models? Brief it with suitable example"}],
   answer:`<h4>Answer</h4>
<p><strong>Ways to Study a System:</strong></p>
<ol>
<li><strong>Experiment with actual system:</strong> Directly test the real system (costly, may be dangerous)</li>
<li><strong>Experiment with model of system:</strong> Build a model and experiment (safer, cheaper)</li>
</ol>
<p>Models can be: <strong>Physical models</strong> (tangible 3D representations) or <strong>Mathematical models</strong> (equations and algorithms).</p>
<p>Mathematical models can be solved <strong>analytically</strong> (exact solutions) or by <strong>simulation</strong> (numerical experimentation).</p>
<h4>Classification Criteria for Simulation Models</h4>
<table><tr><th>Criterion</th><th>Types</th><th>Example</th></tr>
<tr><td>Nature of output</td><td><strong>Deterministic</strong> vs <strong>Stochastic</strong></td><td>F=ma (deterministic) vs Stock market (stochastic)</td></tr>
<tr><td>Time change</td><td><strong>Continuous</strong> vs <strong>Discrete</strong></td><td>Water dam (continuous) vs Bank queue (discrete)</td></tr>
<tr><td>Time dependency</td><td><strong>Static</strong> vs <strong>Dynamic</strong></td><td>Supply-demand (static) vs Population growth (dynamic)</td></tr>
<tr><td>Scale</td><td><strong>Physical</strong> vs <strong>Mathematical</strong></td><td>Ship model (physical) vs Equation model (mathematical)</td></tr></table>`},
  {year:"2011 F", marks:"10", repeats:3, q:"Define simulation. Explain the ways to study a system. Point out the areas where Simulation and Modeling can be used.", occ:[{year:"2011 F", marks:"4", q:"Point out the areas where the Simulation and Modeling can be used"}, {year:"2019 F", marks:"", q:"Application areas of simulation"}, {year:"2019 F", marks:"5", q:"Short Note: Application areas of simulation"}],
   answer:`<h4>Answer</h4>
<p><strong>Simulation</strong> is the imitation of real-world process or system over time. It involves creating a model and conducting experiments to understand behavior or evaluate strategies.</p>
<h4>Ways to Study a System</h4>
<ol>
<li><strong>Experiment with actual system:</strong> Directly test (e.g., test-drive a car)</li>
<li><strong>Experiment with model:</strong>
  <ul>
  <li><strong>Physical model:</strong> Scale models (ship, building)</li>
  <li><strong>Mathematical model:</strong> Analytical solution or Simulation</li>
  </ul></li>
</ol>
<h4>Application Areas</h4>
<ol>
<li><strong>Manufacturing:</strong> Process optimization, design testing, employee training</li>
<li><strong>Healthcare:</strong> Medical procedure training, patient flow management</li>
<li><strong>Transportation:</strong> Traffic management, vehicle design, route optimization</li>
<li><strong>Finance:</strong> Market value prediction, risk analysis, portfolio management</li>
<li><strong>Military:</strong> Combat training, mission planning, strategy development</li>
<li><strong>Telecommunications:</strong> Network design, capacity planning</li>
</ol>`},
  {year:"2011 C", marks:"3+7", repeats:3, q:"Explain real time simulation with example. Explain the type of simulation models", occ:[{year:"2011 C", marks:"3+7", q:"Explain real time simulation with example? Explain the type of simulation models"}, {year:"2010 F", marks:"4+3+3", q:"Discuss real-time simulation with an example. Mention purposes of using simulation. What are the limitations of simulation?"}, {year:"2011 C", marks:"7", q:"Explain the type of simulation models"}],
   answer:`<h4>Answer</h4>

<h4>Real-time simulation</h4>

<p>A <strong>real-time simulation</strong> is one in which the simulated clock runs at the <strong>same rate as the wall clock</strong> — one second of simulated time takes one second of real time. There is no speed-up and no slow-down: every step of the model must finish its computation inside the time the real system would have taken, so the run is under a <strong>hard timing constraint</strong>. A human operator or real hardware is normally part of the loop, so the simulation is <em>interactive</em>.</p>

<p><strong>What it needs:</strong> a real-time clock and scheduler, very fast computation (or a scaled-down model), input/output interfaces to the physical equipment, and a human–machine interface. If any step overruns its time budget the run is invalid, which is why real-time models are kept as simple as the purpose allows.</p>

<p><strong>Example — flight simulator:</strong> the trainee sits in a cockpit mock-up and moves the control column. The computer solves the aircraft equations of motion for that instant and returns the resulting pitch, roll and altitude to the instruments and to the motion platform <em>immediately</em>. Because the timing matches a real aircraft, the pilot's reflexes and workload are trained exactly as they would be in the air, with no risk and far lower cost. Other examples: operator training for a power plant or chemical process, air-traffic-control simulators, and <em>hardware-in-the-loop</em> testing where a real engine controller is wired to a simulated engine.</p>

<h4>Types of simulation models</h4>

<table class="comparison-table">

<tr><th>Basis</th><th>Types</th><th>Meaning and example</th></tr>

<tr><td>Role of time</td><td><strong>Static</strong> / <strong>Dynamic</strong></td><td>Static: time plays no part — the Monte Carlo estimate of &#960;. Dynamic: the state evolves with time — a queue over a working day.</td></tr>

<tr><td>Randomness</td><td><strong>Deterministic</strong> / <strong>Stochastic</strong></td><td>Deterministic: fixed input gives fixed output — constant inter-arrival times. Stochastic: at least one input is random — exponential inter-arrival times.</td></tr>

<tr><td>State change</td><td><strong>Continuous</strong> / <strong>Discrete</strong></td><td>Continuous: state varies smoothly, described by differential equations — a tank level. Discrete: the state jumps at events — the number of customers in a bank.</td></tr>

<tr><td>Clock advance</td><td><strong>Time-driven</strong> / <strong>Event-driven</strong></td><td>Time-driven: fixed increment &#916;t each step. Event-driven: the clock jumps to the next scheduled event.</td></tr>

<tr><td>Termination</td><td><strong>Terminating</strong> / <strong>Steady-state</strong></td><td>Terminating: a definite end event — the bank closes at 5 p.m. Steady-state: runs indefinitely and we estimate long-run averages.</td></tr>

<tr><td>Population</td><td><strong>Open</strong> / <strong>Closed</strong></td><td>Open: entities enter and leave — a supermarket. Closed: a fixed population circulates — machines that are repaired and put back into service.</td></tr>

</table>

<p>Real-time running is a further <em>mode of operation</em> rather than a separate class: any of the models above can be run in real time, interactively, or as a pure batch run.</p>`},
  {year:"2015 F", marks:"10", repeats:2, q:"What do you mean by simulation and modeling? Explain the steps in the simulation study.", occ:[{year:"2015 F", marks:"3+7", q:"What do you mean by simulation and modeling? Explain the steps in the simulation study?"}, {year:"2015 F", marks:"3", q:"What do you mean by simulation and modeling?"}],
   answer:`<h4>Answer</h4>
<p><strong>Simulation</strong> is the imitation of real-world process or system over time. It involves designing a model and conducting experiments to understand system behavior.</p>
<p><strong>Modeling</strong> is the process of representing a model which includes its construction and working. The model is similar to the real system and helps analyze and predict the effect of changes.</p>
<p><strong>12 Steps in Simulation Study:</strong></p>
<ol>
<li><strong>Problem Formulation:</strong> Clearly define the problem</li>
<li><strong>Setting Objectives:</strong> Determine goals and overall plan</li>
<li><strong>Model Conceptualization:</strong> Build abstract model — start simple, add complexity</li>
<li><strong>Data Collection:</strong> Gather input data (arrival rates, service times)</li>
<li><strong>Model Translation:</strong> Code the model in simulation language</li>
<li><strong>Verification:</strong> Does the code do what we intended?</li>
<li><strong>Validation:</strong> Does the model accurately represent reality?</li>
<li><strong>Experimental Design:</strong> Plan experiments — parameters to vary, replications</li>
<li><strong>Production Runs & Analysis:</strong> Execute and analyze output statistically</li>
<li><strong>More Runs?</strong> If more accuracy needed, run again</li>
<li><strong>Documentation & Reporting:</strong> Document everything for decision-makers</li>
<li><strong>Implementation:</strong> Apply the simulation findings</li>
</ol>
<p>These 12 steps are iterative — you may go back to earlier steps if problems are found during verification or validation.</p>`},
  {year:"2012 C", marks:"10", repeats:2, q:"Define real time simulation. Mention the advantages and disadvantages of simulation.", occ:[{year:"2012 C", marks:"", q:"Define real time simulation. Mention the advaJ 'tages ·and disadvantages of simulation. What are the purposes !:.for which simulation can be used? ) 2+4+4 \\"}, {year:"2012 C", marks:"4+4", q:"Mention the advantages and disadvantages of simulation. What are the purposes for which simulation can be used?"}],
   answer:`<h4>Answer</h4>
<p><strong>Real-Time Simulation:</strong> A simulation where the model runs at the same speed as the actual system. The simulation clock advances in real-world time. It is used when the simulation must interact with real-world components or human operators in real-time.</p>
<p><strong>Examples:</strong> Flight simulators for pilot training, military combat training simulators, vehicle testing (hardware-in-the-loop), medical procedure simulators.</p>
<h4>Advantages of Simulation</h4>
<ol>
<li>Useful for sensitivity analysis of complex systems</li>
<li>Suitable for analyzing complex problems that cannot be solved analytically</li>
<li>Can be used when other tools are not applicable</li>
<li>Tool for testing new policies & decision rules without disrupting the real system</li>
<li>Can compress or expand time — observe years of operation in minutes</li>
<li>Can identify bottlenecks and inefficiencies in system design</li>
</ol>
<h4>Disadvantages of Simulation</h4>
<ol>
<li>Building a model requires art that is learned through experience</li>
<li>Results may be complex to interpret</li>
<li>May be time consuming and expensive</li>
<li>Each run produces only estimates, not exact answers</li>
</ol>`},
  {year:"2025 M", marks:"2", repeats:1, q:"Define system simulation and give one example.",
   answer:`<h4>Answer</h4>
<p><strong>System Simulation</strong> is the imitation of the operation of a real-world process or system over time. It involves designing a model of a real system and conducting experiments with this model to understand its behavior or evaluate strategies for its operation.</p>
<p><strong>Example:</strong> A flight simulator used to train pilots. The simulator models the aircraft, weather conditions, and airport environment, allowing pilots to practice without risk. The simulation runs in real-time, responding to pilot inputs just like an actual aircraft would.</p>`},
  {year:"2011 C", marks:"5", repeats:1, q:"Differentiate between discrete system simulation and continuous system simulation",
   answer:`<h4>Answer</h4>

<p>Both are dynamic simulation models; they differ in <strong>how the state of the system changes with time</strong> — and therefore in the mathematics, the clock mechanism and the software used.</p>

<table class="comparison-table">

<tr><th>Point of comparison</th><th>Discrete system simulation</th><th>Continuous system simulation</th></tr>

<tr><td>State variable</td><td>Changes only at separate points in time (events); constant in between</td><td>Changes continuously with time</td></tr>

<tr><td>Nature of the variable</td><td>Integer/countable — number of customers, machines busy, queue length</td><td>Real-valued — temperature, pressure, level, velocity</td></tr>

<tr><td>Mathematical model</td><td>Probability distributions, difference equations, Markov chains, queuing theory</td><td>Differential equations (ordinary or partial)</td></tr>

<tr><td>Time advance</td><td>Next-event time advance — the clock jumps from event to event</td><td>Fixed time increment &#916;t, stepped by a numerical integration routine</td></tr>

<tr><td>Typical event</td><td>Arrival of a customer, completion of service, machine breakdown</td><td>None as such — only the passage of time; a threshold crossing may act as one</td></tr>

<tr><td>Output</td><td>Statistical counters: mean wait, utilisation, queue-length distribution</td><td>Continuous trajectories y(t), i.e. graphs of the variables against time</td></tr>

<tr><td>Languages/tools</td><td>GPSS, SIMSCRIPT, SLAM, Arena, SimPy</td><td>CSSL, CSMP, ACSL, DYNAMO, Simulink; analog/hybrid computers</td></tr>

<tr><td>Examples</td><td>Bank teller queue, hospital OPD, telephone exchange, manufacturing shop</td><td>Tank filling, missile trajectory, population growth, RLC circuit, pure pursuit problem</td></tr>

</table>

<p><strong>Discrete:</strong> a bank with one teller. The only quantities that matter are how many customers are waiting and whether the teller is busy; both change instantly when a customer arrives or a service ends. Between events nothing happens, so the simulation clock is simply moved to the next event time.</p>

<p><strong>Continuous:</strong> the water level in a tank being filled. The level h(t) obeys dh/dt = (Q&#8202;in &#8722; Q&#8202;out)/A, an ordinary differential equation. The level changes at every instant, so the simulation advances in small steps of &#916;t and integrates the equation numerically (Euler, Runge–Kutta).</p>

<p><strong>Hybrid simulation</strong> mixes the two — e.g. a chemical process whose flow rates are continuous but which trips a discrete alarm when a temperature limit is crossed.</p>`},
  {year:"2010 C", marks:"10", repeats:1, q:"What is system modeling? What are the types of system models? Explain dynamic physical model with an example.", occ:[{year:"2010 C", marks:"2+2+6", q:"What is system modeling? What are the types of system :i;nodels? Explain dynamic physical model with an example"}],
   answer:`<h4>Answer</h4>
<p><strong>System Modeling:</strong> The process of representing a model which includes its construction and working. The model is similar to the real system, helping analyze and predict effects of changes.</p>
<h4>Types of System Models</h4>
<p><strong>1. Physical Model:</strong> Tangible 3D representation of a real system.</p>
<ul>
<li><strong>Scale-Down Model:</strong> For large systems (bridges, airplanes, buildings)</li>
<li><strong>Scale-Up Model:</strong> For tiny particles (molecules, electrons, microstructures)</li>
<li><strong>Full-Scale Model:</strong> Actual size (e.g., airplane crash testing)</li>
</ul>
<p><strong>2. Mathematical Model:</strong> Uses equations, inequalities, and functions.</p>
<ul>
<li><strong>Static:</strong> Does not consider changes over time (supply-demand)</li>
<li><strong>Dynamic:</strong> Describes how system evolves over time (population growth)</li>
<li><strong>Analytical:</strong> Exact mathematical expressions</li>
<li><strong>Numerical:</strong> Computational approximation methods</li>
</ul>
<h4>Dynamic Physical Model - Example</h4>
<p>A <strong>wind tunnel model</strong> of an airplane is a dynamic physical model. The airplane model is placed in the wind tunnel, and air is blown at various speeds. The forces acting on the model change dynamically with airspeed, angle of attack, etc. Engineers observe how lift and drag change over time to optimize aircraft design.</p>`},
  {year:"2010 C", marks:"3", repeats:1, q:"Differentiate between deterministic and stochastic simulation", occ:[{year:"2010 C", marks:"", q:"Differentiate between deterministic and stochastic simulation. . 3+7 I~ Explain distributed lag model. t I. a rrivals of 1~"}],
   answer:`<h4>Answer</h4>

<p>A <strong>deterministic</strong> simulation has no random input: the model's output is completely fixed by its input data and initial conditions, so running it twice gives exactly the same answer. A <strong>stochastic</strong> simulation contains at least one random variable (an inter-arrival time, a service time, a demand), so each run is only one <em>sample</em> and repeated runs give different results.</p>

<table class="comparison-table">

<tr><th>Point</th><th>Deterministic simulation</th><th>Stochastic simulation</th></tr>

<tr><td>Input</td><td>All values known exactly</td><td>At least one input drawn from a probability distribution</td></tr>

<tr><td>Output for the same input</td><td>Always identical</td><td>Different every run</td></tr>

<tr><td>Mathematical form</td><td>Algebraic/difference/differential equations</td><td>Equations containing random variables</td></tr>

<tr><td>Random numbers needed</td><td>No</td><td>Yes — pseudo-random numbers drive the sampling</td></tr>

<tr><td>Number of runs</td><td>One run is enough</td><td>Many replications; results are reported as a mean with a confidence interval</td></tr>

<tr><td>Example</td><td>A bank queue in which every customer arrives exactly 5 min apart and is served in exactly 4 min</td><td>The same bank with exponentially distributed arrivals and service times</td></tr>

</table>

<p><strong>Point to write in the exam:</strong> a deterministic model is a special case of a stochastic one in which the variance is zero. Real service systems are almost always stochastic — hence the whole apparatus of random-number generation, input modelling, warm-up removal and output analysis belongs to stochastic simulation.</p>`}
]
};
