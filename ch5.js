window.CHAPTERS = window.CHAPTERS || {};
window.CHAPTERS[5] = {
learn: `
<h2>5.1 Model Building</h2>
<p>Model building is the process of creating a simulation model that accurately represents the real-world system.</p>
<h3>Steps of Model Building</h3>
<ol>
<li><strong>Observe the real system:</strong> Study interactions among components, collect data on their behavior. But observation alone seldom yields sufficient understanding.</li>
<li><strong>Question individuals:</strong> Operators, technicians, repair/maintenance personnel, engineers, supervisors, and managers — collect their experience and domain knowledge.</li>
<li><strong>Construct a conceptual model:</strong> Based on assumptions about components and structure. Identify:
  <ul>
  <li>Assumptions of system components</li>
  <li>Structure assumptions (interactions between components)</li>
  <li>Input parameters and data assumptions</li>
  </ul>
</li>
<li><strong>Construct an operational model:</strong> Use simulation software or programming language. Incorporate the conceptual assumptions into the tool being used.</li>
</ol>

<h3>Model Building Diagram</h3>
<div class="concept-box">
<h4>Three-Level Architecture</h4>
<p><strong>Real System</strong> → (Conceptual Validation) → <strong>Conceptual Model</strong> → (Model Verification) → <strong>Operational Model</strong></p>
<p>And: <strong>Operational Model</strong> → (Calibration & Validation) → <strong>Real System</strong></p>
</div>

<figure class="figure-wrap">

<svg class="figure wide" viewBox="0 0 700 420" role="img" aria-label="Triangle of three levels. The real system at the top. Comparing it with the conceptual model is conceptual validation. The conceptual model at the bottom left is turned into the operational model by model verification. Calibration and validation compares the operational model back with the real system.">

<defs><marker id="fg5a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="fig-head pri"/></marker></defs>

<rect class="fig-node vio" x="250" y="30" width="200" height="56" rx="10"/>
<text class="fig-t" x="350" y="56">Real system</text>
<text class="fig-t sm" x="350" y="74">the thing being studied</text>

<rect class="fig-node pri" x="40" y="290" width="220" height="56" rx="10"/>
<text class="fig-t" x="150" y="316">Conceptual model</text>
<text class="fig-t sm" x="150" y="334">assumptions and structure</text>

<rect class="fig-node sec" x="440" y="290" width="220" height="56" rx="10"/>
<text class="fig-t" x="550" y="316">Operational model</text>
<text class="fig-t sm" x="550" y="334">the program that runs</text>

<path class="fig-edge pri" d="M300,86 L190,286" marker-end="url(#fg5a)"/>
<text class="fig-t sm" x="138" y="186">Conceptual</text>
<text class="fig-t sm" x="138" y="202">validation</text>

<path class="fig-edge" d="M260,318 H434" marker-end="url(#fg5a)"/>
<text class="fig-t sm" x="350" y="306">Model verification</text>

<path class="fig-edge sec" d="M600,290 L440,88" marker-end="url(#fg5a)"/>
<text class="fig-t sm" x="620" y="186">Calibration &amp;</text>
<text class="fig-t sm" x="620" y="202">validation</text>

<text class="fig-t sm start" x="40" y="378">Verification  “is the model built correctly?”  compares conceptual ↔ operational.</text>
<text class="fig-t sm start" x="40" y="396">Validation  “is it the correct model?”  compares operational ↔ real system.</text>

</svg>

<figcaption>Fig 5.1 — The three levels and the three comparisons. Each arrow is one named activity, and the names are what the question asks for: <strong>conceptual validation</strong> (real system ↔ conceptual model), <strong>model verification</strong> (conceptual ↔ operational), and <strong>calibration &amp; validation</strong> (operational ↔ real system). Getting the three pairs the wrong way round is the usual way to lose the marks. <button class="page-chip" type="button" data-page="n1p50">n1 p50</button></figcaption>

</figure>

<h2>5.2 Verification & Validation</h2>
<div class="concept-box important">
<h4>Key Distinction (Very Important for Exams!)</h4>
<p><strong>Verification:</strong> "Are we building the model <em>correctly</em>?" (Correct I/P → Correct O/P)</p>
<p><strong>Validation:</strong> "Are we building the <em>correct</em> model?" (Does model match real world?)</p>
</div>

<table class="comparison-table">
<tr><th>Feature</th><th>Verification</th><th>Validation</th></tr>
<tr><td><strong>Question</strong></td><td>Is the model built correctly?</td><td>Is the correct model built?</td></tr>
<tr><td><strong>Compares</strong></td><td>Conceptual model vs Operational model</td><td>Operational model vs Real system</td></tr>
<tr><td><strong>Focus</strong></td><td>Code correctness, logic errors</td><td>Real-world accuracy, predictive power</td></tr>
<tr><td><strong>Method</strong></td><td>Testing, debugging, code review</td><td>Calibration, comparison with real data</td></tr>
</table>

<h2>5.3 Verification of Simulation Models</h2>
<p>Verification tests whether the model is correctly implemented in simulation software. Key considerations:</p>
<ol>
<li>The operational model should be checked by <strong>someone other than the developer</strong>, preferably an expert in simulation software</li>
<li>Make a <strong>flow diagram</strong> of all logically possible actions the system can perform when an event occurs</li>
<li>Closely <strong>examine the output</strong> for a variety of input sets</li>
<li>Have the operational model <strong>print input parameters</strong> when simulation ends</li>
<li>Make the operational model as <strong>self-documenting</strong> as possible</li>
<li>Verify that <strong>animated operational model</strong> imitates the actual system</li>
<li>Use a <strong>debugger</strong> during simulation model building</li>
<li><strong>Graphical interfaces</strong> are recommended for visualization</li>
</ol>

<h3>Three Classes of Verification Techniques</h3>
<ol>
<li><strong>Finding deficiencies in the model design</strong> — walk through the conceptual model and the code with someone who knows the system, looking for logic that cannot occur in reality.</li>
<li><strong>Model testing with known inputs</strong> — run the model with inputs whose correct output can be worked out by hand, then compare. This is the single most convincing verification evidence.</li>
<li><strong>Determining whether the model is internally consistent</strong> — no contradiction between two parts of the code, and the module interfaces match the conceptual model.</li>
</ol>

<h3>Static vs Dynamic Verification</h3>
<table>
<tr><th>Static (no execution)</th><th>Dynamic (model is run)</th></tr>
<tr><td>Structured walkthroughs of the conceptual model</td><td>Debugging with a debugger / trace facility</td></tr>
<tr><td>Code review by an expert other than the author</td><td>Printing input parameters and intermediate state at run time</td></tr>
<tr><td>Flow diagrams of every logically possible event action</td><td>Comparing output for a variety of input sets</td></tr>
<tr><td>Checking that the code is self-documenting</td><td>Animated operational model vs the real system</td></tr>
</table>

<h3>Additional Checks: Degenerate, Extreme-Condition and Continuity Tests</h3>
<div class="concept-box">
<h4>Degenerate Tests</h4>
<p>Feed the model input values that make its behaviour analytically known and see whether the output matches. Example: set the arrival rate equal to zero in a queuing model — the queue length must stay at zero for the whole run. Example: make every service time identical — the output must stop being random.</p>
</div>
<div class="concept-box">
<h4>Extreme-Condition Tests</h4>
<p>Push the model into the extreme ranges of the input variables to confirm that it still behaves reasonably, and that it fails gracefully outside the range for which it was built. Example: an arrival rate so high that the queue grows without bound — the model should show the queue growing steadily, not produce nonsense or crash.</p>
</div>
<div class="concept-box">
<h4>Continuity Test</h4>
<p>Change an input variable slightly and confirm the output also changes slightly. A large jump in the output for a tiny change in the input is a symptom of a coding error. Example: raising the arrival rate from 4.9 to 5.0 per hour must not change the average waiting time from 10 minutes to 500 minutes.</p>
</div>
<div class="concept-box warn">
<h4>Trace and Operational Graphics</h4>
<p>A <strong>trace</strong> is a time-stamped log of the state, the event list and the statistics as each event executes; reading it exposes errors that no amount of output inspection would reveal. <strong>Operational graphics</strong> (animation, dynamic status displays) let an observer watch the modelled system behave and spot behaviour that is structurally wrong.</p>
<p>Note: some textbooks group degenerate, extreme-condition and continuity tests under validation rather than verification. The tests themselves are identical — only the label differs, so answer with the definitions above and say which grouping you are using.</p>
</div>

<h2>5.4 Calibration & Validation of Models</h2>
<h3>Calibration</h3>
<p><strong>Calibration</strong> is the process of comparing the model with the real-world system and <strong>adjusting parameters</strong> so that the model output matches real-world data. It's an iterative process of parameter tuning.</p>

<h3>Validation Process (Naylor & Finger's 3 Steps)</h3>
<div class="concept-box">
<h4>Three Steps for Model Validation</h4>
<ol>
<li><strong>High Face Validity:</strong> The model should appear reasonable to users and domain experts. Involve potential users in model construction for realism.</li>
<li><strong>Validate Model Assumptions:</strong>
  <ul>
  <li><em>Structural Assumptions:</em> Components and how the system operates (e.g., one queue vs many, FCFS vs priority)</li>
  <li><em>Data Assumptions:</em> Statistical analysis of input/output parameters (e.g., inter-arrival times, service times)</li>
  </ul>
</li>
<li><strong>Validate I/O Transformation:</strong> Compare model output with real system output. The model should make accurate predictions for the range of input data sets of interest.</li>
</ol>
</div>

<h3>Sensitivity Analysis for Validation</h3>
<p>Check model validity by testing if it responds logically to changes:</p>
<div class="example-box">
<h4>Example</h4>
<p>In a queuing system: if arrival rate increases → the queue length and waiting time should also increase. If the model doesn't show this behavior, it may not be valid.</p>
</div>

<h3>Iterative Validation Process</h3>
<p>Validation is iterative — compare, revise, repeat:</p>
<ol>
<li><strong>Initial Model</strong> → compare to reality → <strong>Revise</strong></li>
<li><strong>First Revised Model</strong> → compare to reality → <strong>Revise</strong></li>
<li><strong>Second Revised Model</strong> → compare to reality → Continue until satisfactory</li>
</ol>
<p>Each revision improves the model's accuracy until it adequately represents the real system for the intended purpose.</p>

<h3>Three Ways to Validate the Input–Output Transformation</h3>
<ol>
<li><strong>Prediction of the real system (strongest).</strong> Use the model to predict the performance of the system under a new set of conditions, then run the real system and compare. Predictive validation is the most convincing evidence of validity.</li>
<li><strong>Historical data validation.</strong> Drive the model with input data recorded from the real system and compare the model's output with the output the real system actually produced for the same period.</li>
<li><strong>The Turing test.</strong> Ask people who know the system well to discriminate between the model's output and the real system's output. If the expert cannot reliably tell them apart, the model is said to possess sufficient validity for the purpose.</li>
</ol>
<div class="concept-box">
<h4>The Turing Test in Simulation</h4>
<p>Two forms are used:</p>
<ol>
<li><strong>Interactive Turing test</strong> — an expert interacts with the model (or its animation) without knowing which system is behind the interface.</li>
<li><strong>Retrospective Turing test</strong> — the expert is given printed output of the model and of the real system, in random order, and asked to identify which is which.</li>
</ol>
<p>The test is subjective, so it is used together with objective statistical comparisons, never alone.</p>
</div>

<h3>Objective vs Subjective Validation</h3>
<table class="comparison-table">
<tr><th>Subjective</th><th>Objective</th></tr>
<tr><td>Face validity by experts and users</td><td>Statistical comparison of model output with system output</td></tr>
<tr><td>Turing test</td><td>Confidence intervals, hypothesis tests, K–S and chi-square comparisons</td></tr>
<tr><td>Review of the assumptions document</td><td>Time-series methods — cross-correlation, spectral analysis, Theil's inequality coefficient</td></tr>
</table>

<h3>Statistical Methods for Comparing Model and System Output</h3>
<ol>
<li><strong>Graphical comparison</strong> — plot the model output and the system output (or their trend lines) on the same axes; a close match over time is supporting evidence.</li>
<li><strong>Confidence intervals</strong> — build a confidence interval for the difference between the model mean and the system mean; if it contains zero, the difference is not significant.</li>
<li><strong>Hypothesis tests for means</strong> — the two-sample t test compares the mean of the model output with the mean of the real-system output.</li>
<li><strong>Hypothesis tests for distributions</strong> — the two-sample chi-square test or the two-sample Kolmogorov–Smirnov test compares the whole distribution of model output with that of the system (see the K–S test in Chapter 6).</li>
<li><strong>Change detection</strong> — two independent samples of model output (different random numbers) are checked to ensure that the model itself is not drifting.</li>
</ol>

<h3>Sargent's Model Confidence Levels</h3>
<table>
<tr><th>Level</th><th>Meaning</th></tr>
<tr><td><strong>0</strong></td><td>The model is not validated — clearly inappropriate or based on unverified assumptions.</td></tr>
<tr><td><strong>1</strong></td><td>Validation has been performed by people knowledgeable about the system (face validity) — useful but weak.</td></tr>
<tr><td><strong>2</strong></td><td>Extensive validation of the assumptions and of the input-output transformation has been carried out.</td></tr>
<tr><td><strong>3</strong></td><td>The model gives acceptable results for a wide variety of test conditions and is accepted for the intended purpose. This is the target of a good simulation study.</td></tr>
</table>
<div class="concept-box warn">
<h4>Provenance of this table and of Theil's coefficient</h4>
<p>Neither the model-confidence ladder above nor <strong>Theil's inequality coefficient</strong> (named in the subjective/objective table earlier on this page, and in the model-building answer on the Past Questions tab) appears in the class notes (n1 p48–p53), the old question papers or the question bank. Both are standard validation literature added as extra context, so do not quote them as if the notes stated them. What <em>is</em> on record — and therefore examinable — is the Naylor &amp; Finger three-step process above and the verification / validation / calibration distinction in §5.2–§5.4.</p>
</div>

<h3>Why Validation is Difficult — Sources of Invalidity</h3>
<ul>
<li><strong>Erroneous assumptions</strong> about the structure of the system or about the input distributions.</li>
<li><strong>Lack of knowledge</strong> about the real system's behaviour, so the model is built on guesswork.</li>
<li><strong>Inappropriate level of model detail</strong> — too coarse to capture the behaviour that matters, or too detailed to be estimated reliably.</li>
<li><strong>Poor data collection</strong> — the recorded data may itself be biased or measured incorrectly.</li>
<li><strong>Misinterpretation of the results</strong> — the model may be valid but the conclusions drawn from it are not.</li>
<li><strong>Cost and time</strong> — full validation is expensive, so a model is usually validated only for the specific purpose it was built for.</li>
</ul>

<h3>Putting It Together</h3>
<div class="concept-box">
<h4>Verification vs Calibration vs Validation</h4>
<table>
<tr><th>Term</th><th>Question answered</th><th>Compared</th></tr>
<tr><td><strong>Conceptual validation</strong></td><td>Is the model theory sound?</td><td>Real system ↔ Conceptual model</td></tr>
<tr><td><strong>Verification</strong></td><td>Was the model built correctly?</td><td>Conceptual model ↔ Operational model</td></tr>
<tr><td><strong>Calibration</strong></td><td>Which parameter values make the model match reality?</td><td>Operational model ↔ Real system (parameter tuning)</td></tr>
<tr><td><strong>Validation</strong></td><td>Was the correct model built?</td><td>Operational model ↔ Real system (overall accuracy)</td></tr>
</table>
<p>All four run iteratively until the model is accepted at confidence level 3 for its intended purpose, and the assumptions and validation evidence are then written up in the assumptions document and the validation document.</p>
</div>
`,

quiz: [
  {q:"Verification asks the question:", options:["Is the correct model built?","Are we building the model correctly?","Does the model predict the future?","Is the model cost-effective?"], answer:1, explanation:"Verification = 'Are we building the model correctly?' It checks if the conceptual model is correctly implemented in code."},
  {q:"Validation compares:", options:["Conceptual model vs Operational model","Operational model vs Real system","Source code vs Documentation","Two different models"], answer:1, explanation:"Validation compares the operational (computerized) model against the real-world system to check accuracy."},
  {q:"Calibration involves:", options:["Writing code","Adjusting model parameters to match real data","Deleting the model","Increasing simulation speed"], answer:1, explanation:"Calibration is the process of comparing model with real world and adjusting parameters until model output matches reality."},
  {q:"Who proposed the 3-step validation process?", options:["Von Neumann","Kendall","Naylor & Finger","Gordon"], answer:2, explanation:"Naylor and Finger proposed the 3 steps: 1) High face validity, 2) Validate assumptions, 3) Validate I/O transformation."},
  {q:"'High face validity' means:", options:["The model looks good visually","The model appears reasonable to knowledgeable users","The model runs fast","The model has many features"], answer:1, explanation:"High face validity means the model should appear reasonable to users and domain experts who are knowledgeable about the system."},
  {q:"Structural assumptions in a queuing model include:", options:["Inter-arrival times","One queue vs many queues, FCFS vs priority","Service time distribution","Number of random numbers needed"], answer:1, explanation:"Structural assumptions describe the components and how the system operates — e.g., queue arrangement, service discipline."},
  {q:"Data assumptions involve:", options:["System architecture","Statistical analysis of I/O parameters","Hardware requirements","Network topology"], answer:1, explanation:"Data assumptions involve statistical analysis of input and output parameters like inter-arrival times and service times."},
  {q:"The verification process should be done by:", options:["The developer alone","Someone other than the developer","The customer","No one — it's automatic"], answer:1, explanation:"The operational model should be checked by someone other than the developer, preferably an expert in simulation software."},
  {q:"Sensitivity analysis for validation checks if:", options:["The model is fast enough","The model responds logically to input changes","The code compiles","The model uses random numbers"], answer:1, explanation:"Sensitivity analysis checks if the model responds logically — e.g., increasing arrival rate should increase queue length."},
  {q:"The model building process starts with:", options:["Writing code","Observing the real system","Running simulations","Publishing results"], answer:1, explanation:"Step 1 of model building: Observe the real system and interactions among components, collect data on their behavior."},
  {q:"Which of these is a verification technique rather than a validation technique?", options:["Historical data validation","Turing test","Tracing the event list with known inputs","Face validity review by experts"], answer:2, explanation:"Tracing/debugging with known inputs checks that the code implements the conceptual model correctly — that is verification. The other three compare the model with the real system, which is validation."},
  {q:"The Turing test is used to:", options:["Verify that the code compiles","Validate a model by asking experts to distinguish model output from real system output","Test the speed of the simulation","Generate random numbers"], answer:1, explanation:"In the Turing test, people knowledgeable about the system try to discriminate between the model's output and the real system's output. If they cannot, the model is accepted as sufficiently valid."},
  {q:"A degenerate test on a queuing simulation would be:", options:["Setting the arrival rate to zero and checking the queue stays empty","Running the model for 10 years","Adding more random numbers","Removing the animation"], answer:0, explanation:"Degenerate tests feed input values for which the behaviour is analytically known — with zero arrivals the queue must remain at zero throughout the run."},
  {q:"Sargent's model confidence level 0 means:", options:["The model gives acceptable results for a wide variety of conditions","The model has been validated only by experts (face validity)","The model is not validated and is clearly inappropriate","The model has been verified but not calibrated"], answer:2, explanation:"Level 0 = not validated; level 1 = face validity only; level 2 = extensive validation of assumptions and I/O transformation; level 3 = acceptable results across many test conditions."},
  {q:"An extreme-condition test checks that the model:", options:["Produces the same output for every run","Behaves reasonably in the extreme ranges of its input variables","Runs faster than the real system","Uses no random numbers"], answer:1, explanation:"Extreme-condition tests push input variables to their limits to confirm the model behaves sensibly and fails gracefully outside the range it was built for."}
],

past: [
  {year:"2025 M", marks:"4", repeats:1, q:"Differentiate between verification and validation of simulation models.",
   answer:`<h4>Answer</h4>
<table>
<tr><th>Feature</th><th>Verification</th><th>Validation</th></tr>
<tr><td><strong>Definition</strong></td><td>"Building the model correctly"</td><td>"Building the correct model"</td></tr>
<tr><td><strong>Question</strong></td><td>Does the code correctly implement the conceptual model?</td><td>Does the model accurately represent the real system?</td></tr>
<tr><td><strong>Compares</strong></td><td>Conceptual model vs Operational (computerized) model</td><td>Operational model vs Real-world system</td></tr>
<tr><td><strong>Focus</strong></td><td>Internal correctness — logic errors, bugs, coding mistakes</td><td>External accuracy — real-world fidelity, predictive power</td></tr>
<tr><td><strong>Methods</strong></td><td>Debugging, code review, testing with known inputs, flow diagrams, animation</td><td>Calibration, comparison with real data, sensitivity analysis, face validity</td></tr>
<tr><td><strong>Example</strong></td><td>Checking if arrival process code correctly generates Poisson distributed arrivals</td><td>Comparing simulated average wait times with actual measured wait times in the real bank</td></tr>
</table>
<p><strong>Key relationship:</strong> Verification ensures correctness of implementation. Validation ensures correctness of the model itself. Both are necessary — a verified but invalid model is useless, and an unverified valid concept is buggy.</p>`},
  {year:"General", marks:"10", repeats:1, q:"Explain model building, verification, and validation with diagram.",
   answer:`<h4>Answer</h4>
<p><strong>Model Building Steps:</strong></p>
<ol>
<li><strong>Observe</strong> the real system, collect data</li>
<li><strong>Question</strong> domain experts (operators, engineers, managers)</li>
<li><strong>Construct conceptual model</strong> with assumptions (component, structure, data)</li>
<li><strong>Construct operational model</strong> in simulation software</li>
</ol>
<p><strong>Diagram:</strong> the three levels and the three comparisons the marks are awarded for:</p>
<figure class="figure-wrap">
<svg class="figure wide" viewBox="0 0 700 420" role="img" aria-label="Triangle of three levels. The real system at the top. Comparing it with the conceptual model is conceptual validation. The conceptual model at the bottom left is turned into the operational model by model verification. Calibration and validation compares the operational model back with the real system.">
<defs><marker id="fg5b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="fig-head pri"/></marker></defs>
<rect class="fig-node vio" x="250" y="30" width="200" height="56" rx="10"/>
<text class="fig-t" x="350" y="56">Real system</text>
<text class="fig-t sm" x="350" y="74">the thing being studied</text>
<rect class="fig-node pri" x="40" y="290" width="220" height="56" rx="10"/>
<text class="fig-t" x="150" y="316">Conceptual model</text>
<text class="fig-t sm" x="150" y="334">assumptions and structure</text>
<rect class="fig-node sec" x="440" y="290" width="220" height="56" rx="10"/>
<text class="fig-t" x="550" y="316">Operational model</text>
<text class="fig-t sm" x="550" y="334">the program that runs</text>
<path class="fig-edge pri" d="M300,86 L190,286" marker-end="url(#fg5b)"/>
<text class="fig-t sm" x="138" y="186">Conceptual</text>
<text class="fig-t sm" x="138" y="202">validation</text>
<path class="fig-edge" d="M260,318 H434" marker-end="url(#fg5b)"/>
<text class="fig-t sm" x="350" y="306">Model verification</text>
<path class="fig-edge sec" d="M600,290 L440,88" marker-end="url(#fg5b)"/>
<text class="fig-t sm" x="620" y="186">Calibration &amp;</text>
<text class="fig-t sm" x="620" y="202">validation</text>
<text class="fig-t sm start" x="40" y="378">Verification  “is the model built correctly?”  compares conceptual ↔ operational.</text>
<text class="fig-t sm start" x="40" y="396">Validation  “is it the correct model?”  compares operational ↔ real system.</text>
</svg>
<figcaption>Fig 5.1 — The three levels and the three comparisons. Each arrow is one named activity, and the names are what the question asks for: <strong>conceptual validation</strong> (real system ↔ conceptual model), <strong>model verification</strong> (conceptual ↔ operational), and <strong>calibration &amp; validation</strong> (operational ↔ real system). Getting the three pairs the wrong way round is the usual way to lose the marks. <button class="page-chip" type="button" data-page="n1p50">n1 p50</button></figcaption>
</figure>
<ul>
<li><strong>Conceptual Validation:</strong> Real System ↔ Conceptual Model</li>
<li><strong>Model Verification:</strong> Conceptual Model ↔ Operational Model</li>
<li><strong>Calibration & Validation:</strong> Operational Model ↔ Real System</li>
</ul>
<p><strong>Verification</strong> = Building the model correctly (code implements the concept)</p>
<p><strong>Validation</strong> = Building the correct model (model matches reality)</p>
<p><strong>Naylor & Finger's 3 Steps:</strong></p>
<ol>
<li>Build model with high face validity (reasonable to experts)</li>
<li>Validate model assumptions (structural + data)</li>
<li>Validate I/O transformation (compare outputs with real system)</li>
</ol>
<p><strong>Iterative Process:</strong> Initial Model → Compare → Revise → First Revised Model → Compare → Revise → Continue until satisfactory.</p>`},
  {year:"General", marks:"5", repeats:1, q:"Explain the various verification techniques used for a simulation model.",
   answer:`<h4>Answer</h4>
<p><strong>Verification</strong> asks "Was the model built correctly?" — does the operational (computerised) model faithfully implement the conceptual model? The standard techniques are:</p>
<h4>1. Checks on the model design</h4>
<ul>
<li>Have the operational model checked by <strong>someone other than the developer</strong>, preferably an expert in simulation software.</li>
<li>Draw a <strong>flow diagram</strong> of every logically possible action the system can perform when each event occurs.</li>
<li>Make the operational model as <strong>self-documenting</strong> as possible.</li>
</ul>
<h4>2. Model testing with known inputs</h4>
<ul>
<li>Run the model with inputs whose correct output can be computed by hand, then compare.</li>
<li>Examine the <strong>output for a variety of input sets</strong> and confirm it is sensible.</li>
<li>Have the model <strong>print input parameters</strong> at the end of the run, so the run can be reproduced.</li>
</ul>
<h4>3. Internal consistency</h4>
<ul>
<li>Use a <strong>debugger</strong> while building and running the model.</li>
<li>Use <strong>graphical interfaces / animation</strong> so the behaviour can be watched.</li>
</ul>
<h4>4. Special verification tests</h4>
<table>
<tr><th>Technique</th><th>What it does</th></tr>
<tr><td><strong>Degenerate tests</strong></td><td>Feed inputs whose result is analytically known (zero arrival rate → empty queue).</td></tr>
<tr><td><strong>Extreme-condition tests</strong></td><td>Push inputs to their limits and confirm the model still behaves reasonably.</td></tr>
<tr><td><strong>Continuity test</strong></td><td>A tiny change in an input must produce a tiny change in the output — a large jump indicates a coding error.</td></tr>
<tr><td><strong>Trace / operational graphics</strong></td><td>Log the state and event list as each event executes, or animate the model, to expose structural errors.</td></tr>
</table>
<p><strong>Note:</strong> some textbooks group the degenerate, extreme-condition and continuity tests under validation. State which grouping you are using and give the same definitions.</p>`},
  {year:"General", marks:"7", repeats:1, q:"Explain the approaches used for validating a simulation model. What is the Turing test?",
   answer:`<h4>Answer</h4>
<p><strong>Validation</strong> asks "Was the correct model built?" — does the model, as a whole, represent the real system accurately enough for its intended purpose?</p>
<h4>1. Naylor &amp; Finger's three-step approach</h4>
<ol>
<li><strong>Build with high face validity</strong> — involve users and domain experts so the model appears reasonable to people who know the system.</li>
<li><strong>Validate the model assumptions</strong> — structural assumptions (one queue vs many, FCFS vs priority) and data assumptions (statistical analysis of inter-arrival and service times).</li>
<li><strong>Validate the input–output transformation</strong> — compare model output with real-system output over the range of input data of interest.</li>
</ol>
<h4>2. Three ways to validate the input–output transformation</h4>
<ul>
<li><strong>Predictive validation (strongest):</strong> use the model to predict the system's performance under new conditions, then run the real system and compare.</li>
<li><strong>Historical data validation:</strong> drive the model with recorded real input data and compare its output with what the real system actually produced.</li>
<li><strong>Turing test:</strong> ask knowledge people to distinguish model output from real-system output.</li>
</ul>
<h4>3. The Turing test</h4>
<p>People who are knowledgeable about the system are asked to discriminate between the output of the model and that of the real system. If they cannot tell them apart reliably, the model possesses sufficient validity for the purpose. Two forms exist: an <strong>interactive</strong> Turing test (the expert interacts with the model or its animation) and a <strong>retrospective</strong> Turing test (the expert is shown printed output of both systems in random order). The test is subjective, so it is always used alongside objective statistical comparisons.</p>
<h4>4. Objective statistical comparison methods</h4>
<ul>
<li><strong>Graphical comparison</strong> of model and system output, or of their trend lines.</li>
<li><strong>Confidence intervals</strong> for the difference between model and system means — if the interval contains zero the difference is not significant.</li>
<li><strong>Two-sample t test</strong> to compare means, and the <strong>two-sample chi-square or Kolmogorov–Smirnov test</strong> to compare whole distributions.</li>
<li><strong>Time-series methods</strong> — cross-correlation, spectral analysis, Theil's inequality coefficient.</li>
</ul>
<h4>5. Sensitivity analysis</h4>
<p>Check that the model responds logically to changes, e.g. in a queuing system a higher arrival rate must increase the queue length and waiting time. If it does not, the model may be invalid.</p>
<h4>6. Model confidence levels (Sargent)</h4>
<p>Level 0 not validated, level 1 validation by people knowledgeable about the system, level 2 extensive validation of assumptions and I/O transformation, level 3 acceptable results for a wide variety of test conditions. A good study targets level 3.</p>`},
  {year:"General", marks:"5", repeats:1, q:"Why is validation of a simulation model difficult? Discuss the sources that can make a model invalid.",
   answer:`<h4>Answer</h4>
<p>Validation is difficult because there is no single test that proves a model correct, the real system may not be available for experimentation, and cost and time limit how much evidence can be collected. Common sources of invalidity are:</p>
<ol>
<li><strong>Erroneous assumptions</strong> — wrong structure, or wrong input distributions (for example assuming exponential service times when they are not).</li>
<li><strong>Lack of knowledge of the real system</strong> — the model is built on guesswork because the system's behaviour is not well understood.</li>
<li><strong>Inappropriate level of model detail</strong> — too coarse to capture the behaviour that matters, or so detailed that its parameters cannot be estimated reliably.</li>
<li><strong>Poor data and data collection</strong> — recorded data may be biased, incomplete, or measured with the wrong instrument; garbage in, garbage out.</li>
<li><strong>Incorrectly modelled distributions</strong> — the fitted input distribution is rejected by goodness-of-fit tests but used anyway.</li>
<li><strong>Misinterpretation of the results</strong> — the model may be valid while the conclusions drawn from it are not.</li>
<li><strong>Cost and time</strong> — exhaustive validation is expensive, so a model is normally validated only for the specific purpose it was built for.</li>
</ol>
<p><strong>Mitigation:</strong> use several independent validation approaches together (face validity, validated assumptions, historical data, predictive validation, Turing tests, statistical comparison), keep an assumptions document and a validation document, and state the confidence level at which the model is accepted.</p>`}
]
};
