window.CHAPTERS = window.CHAPTERS || {};
window.CHAPTERS[7] = {
learn: `
<h2>7.1 Estimation Methods</h2>
<p>Simulation outputs are <strong>random variables</strong> because inputs contain randomness. The <strong>output</strong> is the set of results the model produces; analysing it is what turns those results into something the analyst and the decision maker can act on. Therefore, statistical analysis is essential to draw valid conclusions.</p>
<div class="concept-box important">
<h4>Why we analyze simulation output</h4>
<ol>
<li><strong>Validation &amp; verification</strong> of the simulation model</li>
<li><strong>Understanding system behaviour</strong> — what the system really does under the modelled conditions</li>
<li><strong>Evaluating design alternatives</strong> — comparing candidate configurations on the same measure</li>
<li><strong>Predicting the behaviour</strong> of the real system</li>
<li><strong>Making an informed decision</strong> — a result is only usable once its uncertainty is known</li>
</ol>
<p>So analysis is <em>estimation</em>: when the variables of interest fluctuate over simulated time (stochastic dynamics), a single number means nothing until the uncertainty attached to it is stated too.</p>
</div>

<h3>Types of Simulations</h3>
<table class="comparison-table">
<tr><th>Terminating Simulation</th><th>Non-Terminating (Steady-State) Simulation</th></tr>
<tr><td>Has a natural ending point</td><td>No natural ending point</td></tr>
<tr><td>Example: Bank closes at 5 PM</td><td>Example: 24/7 emergency room</td></tr>
<tr><td>Analyze each run independently</td><td>Need to handle initial bias</td></tr>
</table>

<h3>Point Estimation</h3>
<p>A single value estimate of a parameter:</p>
<div class="formula-box">X̄ = (1/n) × ΣXᵢ (Sample Mean)</div>
<p>The sample mean X̄ is the point estimate of the population mean μ.</p>

<h3>Interval Estimation (Confidence Intervals)</h3>
<p>A range of values likely to contain the true parameter:</p>
<div class="formula-box">X̄ ± t<sub>α/2, n−1</sub> × S/√n</div>
<p>where S = sample standard deviation, n = number of observations, t = t-distribution critical value</p>

<div class="worked">
<div class="worked-head"><span>Confidence interval for the mean waiting time</span><span class="meta">5 replications · 95% · t = 2.776</span></div>

<p class="page-src">Source page: <button class="page-chip" type="button" data-page="n2p36">n2 p36</button></p>
<div class="worked-givens">
<div><span>Observations</span><b>4.2, 3.8, 5.1, 4.5, 3.9 min</b></div>
<div><span>n</span><b>5</b></div>
<div><span>Degrees of freedom</span><b>n − 1 = 4</b></div>
</div>
<ol class="worked-steps">
<li><span class="worked-calc">X̄ = (4.2 + 3.8 + 5.1 + 4.5 + 3.9) / 5 = 21.5 / 5 = 4.30 min</span></li>
<li><span class="worked-calc">S² = [(4.2−4.3)² + (3.8−4.3)² + (5.1−4.3)² + (4.5−4.3)² + (3.9−4.3)²] / (5−1)
  = [0.01 + 0.25 + 0.64 + 0.04 + 0.16] / 4 = 1.10 / 4 = 0.275</span><span class="worked-note">Divide by n − 1 = 4, not by n = 5: a sample variance uses the degrees of freedom.</span></li>
<li><span class="worked-calc">S = √0.275 = 0.5244</span></li>
<li><span class="worked-calc">95% CI = X̄ ± t × S/√n = 4.30 ± 2.776 × 0.5244/√5
       = 4.30 ± 2.776 × 0.2345 = 4.30 ± 0.651</span></li>
</ol>
<div class="worked-result"><span>95% CI</span><b>(3.65, 4.95) minutes</b></div>
</div>
<div class="concept-box important">
<h4>Common mistake</h4>
<p>An earlier draft of this example divided the squared deviations by n and came out with S = 0.508 and the interval (3.67, 4.93). Both numbers were wrong. The variance always divides by <strong>n − 1</strong>, and the standard error is <strong>S/√n</strong> — not S alone.</p>
</div>

<h2>7.2 Simulation Run Statistics</h2>
<p>Measures collected during simulation runs:</p>
<ul>
<li><strong>Mean:</strong> Average of the output measure</li>
<li><strong>Variance:</strong> Spread of results around the mean</li>
<li><strong>Minimum & Maximum:</strong> Range of observed values</li>
<li><strong>Utilization:</strong> Fraction of time a resource is busy</li>
<li><strong>Throughput:</strong> Number of entities processed per unit time</li>
</ul>

<h3>Types of Statistics</h3>
<table class="comparison-table">
<tr><th>Time-Averaged Statistics</th><th>Observation-Based Statistics</th></tr>
<tr><td>Averaged over simulated time</td><td>Based on individual observations</td></tr>
<tr><td>Example: Average queue length over 8 hours</td><td>Example: Average waiting time per customer</td></tr>
<tr><td>Weighted by time duration</td><td>Simple average of observations</td></tr>
</table>

<h3>Batch Means Method</h3>
<p>For long single runs: divide the run into <strong>batches</strong> of equal length. Treat each batch mean as an independent observation. Use batch means to calculate confidence intervals.</p>

<h2>7.3 Replication of Runs</h2>
<div class="concept-box important">
<h4>Most Frequently Asked Topic (~10 times in past exams!)</h4>
<p>Replication of runs is the MOST important topic in this chapter.</p>
</div>

<p><strong>Replication</strong> means running the simulation <strong>multiple times</strong> with <strong>different random number seeds</strong>. Each run is called a <em>replication</em> and is statistically independent.</p>

<figure class="figure-wrap">

<svg class="figure wide" viewBox="0 0 700 362" role="img" aria-label="Ten confidence intervals for an increasing number of replications, all centred on the same point estimate. The interval is widest at one replication and narrows as the number of replications rises, following a one over root n curve, so most of the gain is made in the first few replications.">

<text class="fig-t sm start" x="20" y="26">Each replication tightens the interval — but only as 1/√n</text>

<path class="fig-axis" d="M70,270 H660"/>
<path class="fig-axis" d="M70,270 V50"/>
<path class="fig-grid" d="M70,150 H660"/>
<text class="fig-t sm start" x="78" y="144">Ȳ — the point estimate, the same in every case</text>

<path class="fig-edge pri thin" d="M70,60 V240 M64,60 H76 M64,240 H76"/>
<path class="fig-edge pri thin" d="M135.5,86.4 V213.6 M129.5,86.4 H141.5 M129.5,213.6 H141.5"/>
<path class="fig-edge pri thin" d="M201,98 V202 M195,98 H207 M195,202 H207"/>
<path class="fig-edge pri thin" d="M266.5,105 V195 M260.5,105 H272.5 M260.5,195 H272.5"/>
<path class="fig-edge pri thin" d="M332,109.8 V190.2 M326,109.8 H338 M326,190.2 H338"/>
<path class="fig-edge pri thin" d="M397.5,113.3 V186.7 M391.5,113.3 H403.5 M391.5,186.7 H403.5"/>
<path class="fig-edge pri thin" d="M463,115.9 V184.1 M457,115.9 H469 M457,184.1 H469"/>
<path class="fig-edge pri thin" d="M528.5,118.2 V181.8 M522.5,118.2 H534.5 M522.5,181.8 H534.5"/>
<path class="fig-edge pri thin" d="M594,120 V180 M588,120 H600 M588,180 H600"/>
<path class="fig-edge pri thin" d="M659.5,121.5 V178.5 M653.5,121.5 H665.5 M653.5,178.5 H665.5"/>

<path class="fig-curve" d="M70,60 L135.5,86.4 L201,98 L266.5,105 L332,109.8 L397.5,113.3 L463,115.9 L528.5,118.2 L594,120 L659.5,121.5"/>
<path class="fig-curve" d="M70,240 L135.5,213.6 L201,202 L266.5,195 L332,190.2 L397.5,186.7 L463,184.1 L528.5,181.8 L594,180 L659.5,178.5"/>
<text class="fig-t pri start" x="420" y="96">± t · s/√n</text>

<path class="fig-edge thin" d="M70,270 V262 M135.5,270 V262 M201,270 V262 M266.5,270 V262 M332,270 V262 M397.5,270 V262 M463,270 V262 M528.5,270 V262 M594,270 V262 M659.5,270 V262"/>
<text class="fig-t sm" x="70" y="286">1</text>
<text class="fig-t sm" x="135.5" y="286">2</text>
<text class="fig-t sm" x="201" y="286">3</text>
<text class="fig-t sm" x="266.5" y="286">4</text>
<text class="fig-t sm" x="332" y="286">5</text>
<text class="fig-t sm" x="397.5" y="286">6</text>
<text class="fig-t sm" x="463" y="286">7</text>
<text class="fig-t sm" x="528.5" y="286">8</text>
<text class="fig-t sm" x="594" y="286">9</text>
<text class="fig-t sm" x="659.5" y="286">10</text>
<text class="fig-t sm" x="365" y="306">number of replications n</text>

<text class="fig-t sm start" x="20" y="332">Most of the gain is spent early: doubling n removes only about 30% of the width. To halve it you need n ≈ (t · s / ε)²,</text>
<text class="fig-t sm start" x="20" y="346">so a target half-width ε costs four times the runs of a target 2ε.</text>

</svg>

<figcaption>Fig 7.1 — Why replication is necessary, drawn as intervals rather than as a list. The point estimate never moves (the dashed line); only the width changes, and it changes as 1/√n. Read off the picture why a single run is not evidence: with n = 1 the interval is wider than any of the differences people usually want to detect.</figcaption>

</figure>

<h3>Why Replication is Necessary</h3>
<ol>
<li><strong>Get independent observations:</strong> Each replication provides an independent data point</li>
<li><strong>Estimate variability:</strong> Multiple runs show how much results vary</li>
<li><strong>Calculate confidence intervals:</strong> Need multiple observations for statistical inference</li>
<li><strong>Reduce sampling error:</strong> More replications → more accurate estimates</li>
<li><strong>A single run may give misleading results</strong> due to random variation</li>
</ol>

<h3>Mathematical Modeling</h3>
<p>Let Y₁, Y₂, ..., Yₙ be outputs of n <strong>independent replications</strong>. These are <strong>IID</strong> (Independent and Identically Distributed) random variables.</p>

<div class="formula-box">
Point Estimate: Ȳ = (1/n) × ΣYᵢ<br><br>
Variance Estimate: S² = (1/(n-1)) × Σ(Yᵢ - Ȳ)²<br><br>
Confidence Interval: Ȳ ± t<sub>α/2, n−1</sub> × S/√n
</div>

<div class="worked">
<div class="worked-head"><span>Replication of runs — point estimate and confidence interval</span><span class="meta">n = 5 · 95% · t = 2.776</span></div>

<p class="page-src">Source page: <button class="page-chip" type="button" data-page="n2p36">n2 p36</button></p>
<div class="worked-givens">
<div><span>Average wait Yᵢ</span><b>12.5, 14.2, 11.8, 13.6, 12.9 min</b></div>
<div><span>Replications</span><b>n = 5</b></div>
<div><span>Degrees of freedom</span><b>n − 1 = 4</b></div>
</div>
<ol class="worked-steps">
<li><span class="worked-calc">Ȳ = (12.5 + 14.2 + 11.8 + 13.6 + 12.9) / 5 = 65.0 / 5 = 13.0 min</span><span class="worked-note">This is the point estimate of the true mean — one number from five independent runs.</span></li>
<li><span class="worked-calc">S² = [0.25 + 1.44 + 1.44 + 0.36 + 0.01] / 4 = 3.50 / 4 = 0.875</span><span class="worked-note">Squaring each (Yᵢ − 13.0): −0.5, +1.2, −1.2, +0.6, −0.1.</span></li>
<li><span class="worked-calc">S = √0.875 = 0.9354 min</span></li>
<li><span class="worked-calc">95% CI = Ȳ ± t × S/√n = 13.0 ± 2.776 × 0.9354/2.2361
       = 13.0 ± 2.776 × 0.4183 = 13.0 ± 1.161</span><span class="worked-note">If this interval is too wide to decide anything, the answer is more replications — the width shrinks as 1/√n.</span></li>
</ol>
<div class="worked-result"><span>Ȳ = 13.0 min</span><b>95% CI (11.84, 14.16) minutes</b></div>
</div>

<h2>7.4 Elimination of Initial Bias</h2>
<p>At the start of simulation, the system is typically in an <strong>unrealistic state</strong> (empty and idle). These initial observations are <strong>biased</strong> and don't represent steady-state behavior.</p>

<h3>The Warm-Up Problem</h3>
<p>When a simulation starts from an empty state (e.g., bank with no customers at t=0), the initial period produces observations that are not representative of normal operation. This is called <strong>initial transient</strong> or <strong>initialization bias</strong>.</p>

<h3>Methods to Handle Initial Bias</h3>
<ol>
<li><strong>Long Run Approach:</strong> Run the simulation long enough that initial bias becomes negligible compared to the total run length.</li>
<li><strong>Truncation (Deletion):</strong> Delete initial observations. Use <strong>Welch's method</strong> to determine the truncation point:
  <ul>
  <li>Run multiple replications</li>
  <li>Calculate moving averages across replications</li>
  <li>Plot the moving average — the deletion point d is where it appears to converge to steady state</li>
  </ul>
</li>
<li><strong>Moving Average Approach:</strong> Use moving averages to identify when steady state begins. The point where the moving average stabilizes is the warm-up period.</li>
<li><strong>Start in Busy State:</strong> Initialize the simulation in a state that represents typical operation (e.g., some customers already in queue) rather than empty.</li>
</ol>

<div class="concept-box tip">
<h4>Welch's Method</h4>
<p>Make n replications, each of length m. Calculate the ensemble average Ȳ(t) at each time t. Apply moving average of window w. Plot Ȳ_w(t) and choose deletion point d where it appears to converge.</p>
</div>
`,

quiz: [
  {q:"Why must simulation output be analyzed statistically?", options:["Because computers make errors","Because outputs are random variables","Because managers demand it","Because it's standard procedure"], answer:1, explanation:"Simulation outputs are random variables (due to random inputs), so statistical analysis is needed to draw valid, reliable conclusions."},
  {q:"Replication of runs means:", options:["Running the simulation once with many customers","Running the simulation multiple times with different random seeds","Copying the simulation code","Running two different models"], answer:1, explanation:"Replication means running the simulation multiple times with different random number seeds. Each run is independent."},
  {q:"The point estimate formula is:", options:["Ȳ = max(Yᵢ)","Ȳ = (1/n) × ΣYᵢ","Ȳ = Σ(Yᵢ)²","Ȳ = Y₁ × Y₂"], answer:1, explanation:"The point estimate (sample mean) is Ȳ = (1/n) × ΣYᵢ, averaging the outputs of n independent replications."},
  {q:"The confidence interval formula is:", options:["Ȳ ± S","Ȳ ± t × S/√n","Ȳ × t/n","S ± Ȳ/n"], answer:1, explanation:"CI = Ȳ ± t<sub>α/2, n−1</sub> × S/√n, where S is sample standard deviation and n is number of replications."},
  {q:"Initial bias in simulation occurs because:", options:["Random numbers are bad","System starts in an unrealistic empty state","The model is wrong","Computer clock is inaccurate"], answer:1, explanation:"Initial bias occurs because the simulation typically starts from an empty/idle state, which doesn't represent normal steady-state operation."},
  {q:"Which method deletes initial observations to remove bias?", options:["Replication","Truncation/Deletion","Batch means","Long run"], answer:1, explanation:"Truncation (deletion) removes initial biased observations. Welch's method helps determine how many observations to delete."},
  {q:"Welch's method is used to:", options:["Generate random numbers","Determine the warm-up deletion point","Calculate service rates","Build simulation models"], answer:1, explanation:"Welch's method uses moving averages across replications to determine when steady state begins (the deletion point d)."},
  {q:"In a terminating simulation:", options:["There is no natural ending point","The simulation has a natural ending point","Bias cannot occur","Only one run is needed"], answer:1, explanation:"A terminating simulation has a natural ending point (e.g., bank closing at 5 PM). Each run is analyzed independently."},
  {q:"The batch means method divides:", options:["Random numbers into groups","A long single run into equal batches","Multiple runs into categories","The model into components"], answer:1, explanation:"Batch means divides a long single run into batches of equal length, treating each batch mean as an independent observation."},
  {q:"More replications lead to:", options:["More bias","Less accurate estimates","More accurate estimates with narrower confidence intervals","Slower computation only"], answer:2, explanation:"More replications provide more data points, reducing sampling error and producing narrower (more precise) confidence intervals."}
],

past: [
  {year:"2015 F", marks:"5", repeats:8, q:"What is initial bias in simulation output? Mention the idea of elimination of initial bias.", occ:[{year:"2015 F", marks:"3+2", q:"What is initial bias in simulation output? Mention the idea of elimination of initial bias"}, {year:"2019 F", marks:"10", q:"Explain elimination of internal bias in the analysis of simulation output"}, {year:"2011 C", marks:"", q:"Elimination of internal bias ·"}, {year:"2014 F", marks:"5", q:"Short Note: Elimination of internal bias"}, {year:"2012 C", marks:"", q:"E~lain replication of runs and elimination of initial bias in th~) simulation output analysis. 5+5 . '"}, {year:"2012 C", marks:"5", q:"Explain elimination of initial bias in the simulation output analysis"}, {year:"2010 C", marks:"", q:"Why the output of Simulation has to be analyzed? How would you eliminate internal bias in the analysis of Simulation output? 1O"}, {year:"2010 C", marks:"10", q:"How would you eliminate internal bias in the analysis of Simulation output?"}],
   variants:[{year:"2010 C", marks:"10", q:"How would you eliminate internal bias in the analysis of Simulation output?", answer:`<h4>Answer</h4>
<p><strong>Problem:</strong> Simulation starts from an unrealistic empty state. Initial observations are biased (not representing steady state).</p>
<h4>Method 1: Long Run Approach</h4>
<p>Run simulation for a very long time. The proportion of biased data becomes negligible. Simple but wasteful — most of the long run may be unnecessary.</p>
<h4>Method 2: Truncation/Deletion (Recommended)</h4>
<p>Delete the first d observations. To find d, use <strong>Welch's Method:</strong></p>
<ol>
<li>Make n replications, each of length m</li>
<li>Calculate ensemble average Ȳ(t) = (1/n)Σᵢ Yᵢ(t) at each time t</li>
<li>Apply moving average of window w: Ȳ_w(t) = (1/(2w+1)) × Σ<sub>s=−w</sub><sup>w</sup> Ȳ(t+s)</li>
<li>Plot Ȳ_w(t) and choose d where the plot converges/stabilizes</li>
<li>Delete observations before time d from each replication</li>
</ol>
<h4>Method 3: Start in Busy State</h4>
<p>Initialize system state to represent typical operation (e.g., start with average number of customers already in queue). Reduces warm-up time but requires knowledge of typical state.</p>
<h4>Method 4: Moving Average Approach</h4>
<p>Calculate running averages and identify the point where they stabilize. All data before this point is discarded.</p>`}],
   answer:`<h4>Answer</h4>
<p><strong>Initial bias (the initial transient / warm-up period).</strong> A simulation normally starts from an artificial state — a bank with no customers at time 0, a workshop with no jobs. The system has not yet reached its normal (steady-state) operation, so the early observations are unrepresentative: the first customers wait zero time and the servers are under-utilised. Averaging those biased observations into the result drags every estimate downwards.</p>
<p><strong>Example:</strong> a bank simulation that starts empty will report a mean waiting time of about two minutes, whereas the real branch, which is never empty during business hours, runs at about eight minutes.</p>
<h4>How the initial bias is eliminated</h4>
<ol>
<li><strong>Long-run approach.</strong> Run the simulation for so long that the warm-up period becomes a negligible fraction of the total. Simple, but wasteful — most of the extra computing time buys nothing but dilution.</li>
<li><strong>Truncation (deletion) — the standard method.</strong> Delete the first d observations and use only the remainder. The question is how to choose d, and the usual answer is <strong>Welch's procedure</strong>:
  <ol>
  <li>Make n independent replications, each of length m.</li>
  <li>Compute the ensemble average at each time t: &#256;(t) = (1/n) &#931;&#7522; Y&#7522;(t).</li>
  <li>Smooth it with a moving average of window w: &#256;_w(t) = (1/(2w+1)) &#931;_{s=&#8722;w}^{w} &#256;(t+s).</li>
  <li>Plot &#256;_w(t) and pick d as the time at which the plot flattens out.</li>
  <li>Discard all observations before d in every replication.</li>
  </ol></li>
<li><strong>Moving-average approach.</strong> Without replications, plot running averages of the single run and discard everything before the point where they stabilise.</li>
<li><strong>Initialise in a typical (busy) state.</strong> Start the model with the number of customers, machines or jobs that the real system usually has. It shortens the warm-up considerably, but it needs prior knowledge of the typical state — and a wrong initial state simply replaces one bias with another.</li>
</ol>
<p><strong>What to say in the exam:</strong> the bias is a property of the <em>starting condition</em>, not of the model, so it is cured by either removing the warm-up observations or starting from a realistic state — and whichever is chosen, the choice must be reported with the results.</p>`},
  {year:"2015 F", marks:"5", repeats:6, q:"Explain the mathematical modeling of replication of runs.", occ:[{year:"2015 F", marks:"5", q:"Explain the mathematical modeling of replication of runs"}, {year:"2025 M", marks:"4", q:"Why is replication of runs necessary in output analysis?"}, {year:"2019 F", marks:"10", q:"Explain the process of replication of runs in analysis of simulation output"}, {year:"2012 C", marks:"", q:"Estimation method in simulation output ~alysis_ I'"}, {year:"2012 C", marks:"5", q:"Explain replication of runs in the simulation output analysis"}, {year:"2011 C", marks:"2", q:"Why do we need replication of run in simulation?"}],
   variants:[{year:"2025 M", marks:"4", q:"Why is replication of runs necessary in output analysis?", answer:`<h4>Answer</h4>
<p>Replication of runs is necessary because:</p>
<ol>
<li><strong>Outputs are random variables:</strong> Since simulation uses random inputs, a single run gives only one sample — which may be misleading</li>
<li><strong>Statistical independence:</strong> Each replication (with different seed) provides an independent observation needed for valid statistical inference</li>
<li><strong>Confidence intervals:</strong> Multiple replications allow calculation of confidence intervals: Ȳ ± t<sub>α/2, n−1</sub> × S/√n</li>
<li><strong>Variability estimation:</strong> Multiple runs reveal how much results vary, giving insight into the reliability of conclusions</li>
<li><strong>Reducing sampling error:</strong> More replications → more accurate estimates (error decreases as 1/√n)</li>
</ol>`}],
   answer:`<h4>Answer</h4>
<p>Let Y₁, Y₂, ..., Yₙ be outputs of <strong>n independent replications</strong> of a simulation. Each Yᵢ is obtained by running the simulation with a different random number seed.</p>
<p>These Y₁, Y₂, ..., Yₙ are <strong>IID</strong> (Independent and Identically Distributed) random variables.</p>
<p><strong>Point Estimate (Sample Mean):</strong></p>
<div class="formula-box">Ȳ = (1/n) × Σᵢ₌₁ⁿ Yᵢ</div>
<p><strong>Variance Estimate:</strong></p>
<div class="formula-box">S² = (1/(n-1)) × Σᵢ₌₁ⁿ (Yᵢ - Ȳ)²</div>
<p><strong>Confidence Interval:</strong></p>
<div class="formula-box">Ȳ ± t<sub>α/2, n−1</sub> × S/√n</div>
<p>As n increases, S/√n decreases, giving narrower (more precise) confidence intervals. The choice of n depends on the desired precision and available computing resources.</p>`},
  {year:"2019 F", marks:"10", repeats:5, q:"'Simulation output has to be analyzed.' Justify the statement. Explain replication of runs and elimination of initial bias.", occ:[{year:"2019 F", marks:"10", q:"\"Simulation output has to .be analyzed\", Justify the statement. Explain the process of replication of runs and elimination of ) internal bias in the analysis of simulation output"}, {year:"2010 F", marks:"4+6", q:"Why the output of simulation has to - be analyzed? Explain Replication of Runs method to any simulation output"}, {year:"2014 F", marks:"10", q:"Why the output of simulation has to be analyzed? Explain Replication of Runs method."}, {year:"2011 F", marks:"", q:"Explain why simulation output is analyzed. Brief, why · Replication ' ·of ·_ Runs is .performed during . the .analysis of simulation output? .. . . ·- ·. . . 5+!? )"}, {year:"2011 F", marks:"5+5", q:"Explain why simulation output is analyzed. Why Replication of Runs is performed during analysis?"}],
   variants:[{year:"2014 F", marks:"10", q:"Why the output of simulation has to be analyzed? Explain Replication of Runs method.", answer:`<h4>Answer</h4>
<h4>Why Analysis is Needed</h4>
<ol>
<li>Simulation outputs are <strong>random variables</strong> — not deterministic</li>
<li>A single run gives only one sample point from a probability distribution</li>
<li>Statistical analysis determines <strong>accuracy and reliability</strong> of results</li>
<li>Helps calculate <strong>confidence intervals</strong> for decision making</li>
<li>Without analysis, results may be <strong>misleading</strong> due to random variation</li>
</ol>
<h4>Replication of Runs Method</h4>
<p><strong>Method:</strong> Run the simulation n times, each with a <strong>different random number seed</strong>.</p>
<p><strong>Process:</strong></p>
<ol>
<li>Run simulation n times → get Y₁, Y₂, ..., Yₙ (independent outputs)</li>
<li>Calculate point estimate: Ȳ = (1/n)ΣYᵢ</li>
<li>Calculate variance: S² = Σ(Yᵢ-Ȳ)²/(n-1)</li>
<li>Calculate confidence interval: Ȳ ± t<sub>α/2, n−1</sub> × S/√n</li>
</ol>
<p><strong>Example:</strong> 5 replications of a bank simulation give average wait times: 12.5, 14.2, 11.8, 13.6, 12.9 min</p>
<p>Ȳ = 13.0, S = 0.935</p>
<p>95% CI = 13.0 ± 2.776 × 0.935/√5 = 13.0 ± 1.16 = (11.84, 14.16) minutes</p>
<p>We are 95% confident the true average wait time is between 11.84 and 14.16 minutes.</p>`}],
   answer:`<h4>Answer</h4>
<h4>Why Simulation Output Must Be Analyzed</h4>
<p>Simulation outputs are <strong>random variables</strong> because the inputs include random components. A single simulation run produces only estimates, not exact values. Without statistical analysis:</p>
<ul>
<li>Results may be misleading due to random variation</li>
<li>We cannot determine the accuracy or reliability of results</li>
<li>Decision makers cannot know how confident they should be in the findings</li>
</ul>

<h4>Replication of Runs</h4>
<p>Running the simulation <strong>n times with different random seeds</strong>. Each run is independent.</p>
<p>Let Y₁, Y₂, ..., Yₙ be outputs of n replications (IID random variables):</p>
<ul>
<li>Point estimate: Ȳ = (1/n) × ΣYᵢ</li>
<li>Variance: S² = (1/(n-1)) × Σ(Yᵢ - Ȳ)²</li>
<li>95% CI: Ȳ ± t<sub>0.025, n−1</sub> × S/√n</li>
</ul>
<p>Purpose: Get independent observations, estimate variability, calculate confidence intervals.</p>

<h4>Elimination of Initial Bias</h4>
<p>At simulation start, the system is in an unrealistic state (empty/idle). Methods:</p>
<ol>
<li><strong>Long run:</strong> Run long enough that initial bias becomes negligible</li>
<li><strong>Truncation:</strong> Delete initial observations (use Welch's method to find deletion point)</li>
<li><strong>Moving average:</strong> Identify when steady state begins</li>
<li><strong>Start in busy state:</strong> Initialize with typical operating conditions</li>
</ol>`},
  {year:"2014 F, 2010 F, 2010 C", marks:"4", repeats:5, q:"Why the output of simulation has to be analyzed?", occ:[{year:"2015 F", marks:"2", q:"Why simulation output is analyzed?"}],
   answer:`<h4>Answer</h4>

<p><strong>In one line:</strong> the output of a simulation is not an answer, it is a <em>sample</em>. Reading a number straight off one run and treating it as the truth of the system is the single commonest mistake in simulation practice, and the whole subject of output analysis exists to stop it.</p>

<h4>Why the output has to be analysed</h4>

<ol>

<li><strong>The output is a random variable.</strong> Because arrivals, service times and failures are random, each run produces different observations. The quantity the manager wants — the <em>true</em> mean waiting time — is the mean of a distribution, and a run gives only one realisation of it. A point estimate alone is meaningless without an indication of its precision.</li>

<li><strong>To attach a precision to every estimate.</strong> Analysis turns the raw sample into a <em>confidence interval</em>: "the mean wait is 8.6 minutes, 95 % confident it lies between 7.9 and 9.3". Without an interval there is no way to tell whether a difference between two designs is real or just noise.</li>

<li><strong>To remove the initial bias (warm-up / transient).</strong> A simulation almost always starts from an artificial state — an empty bank at 9 a.m. with no customers. The early observations are therefore unrepresentative: queues have not built up and the server is under-utilised. Those observations must be discarded (or the run started from a realistic state) before any average is computed.</li>

<li><strong>Because the observations are correlated.</strong> The waiting time of customer n is closely related to that of customer n&#8722;1, so the classical formulas that assume independent observations — s/&#8730;n — understate the true variance. Output analysis supplies the correct methods: independent replications, batch means, regeneration.</li>

<li><strong>To decide how long to run and how many replications are needed.</strong> The width of the interval shrinks as 1/&#8730;n, so analysis answers the practical question: how much computing time must I spend for the accuracy I need? It also determines when a steady state has been reached.</li>

<li><strong>To compare alternatives on a fair basis.</strong> Two designs must be run with the same random-number streams (common random numbers) and compared by a paired test; otherwise the difference between the runs may be nothing but the difference in the random draws.</li>

<li><strong>Because the distribution matters, not only the mean.</strong> A mean wait of 5 minutes may mean everyone waits 5 minutes, or that most customers wait nothing while a few wait an hour. Analysis exposes variability, the maximum and the percentiles — which is what people actually experience.</li>

<li><strong>To avoid publishing a wrong decision.</strong> Simulation studies are used to justify capital spending on servers, beds, runways and machines. A decision based on an unanalysed single run can be worse than no simulation at all, because it carries false authority.</li>

</ol>

<p><strong>What analysis consists of:</strong> (i) deciding whether the model is terminating or steady-state; (ii) removing or reducing the initial-bias period; (iii) obtaining independent observations — by <em>replication of runs</em>, by <em>batch means</em> or by the regenerative method; (iv) computing point and interval estimates for every performance measure; (v) testing the alternatives statistically; and (vi) reporting the number of runs, the run length and the assumptions behind the intervals.</p>`},
  {year:"2015 F", marks:"3", repeats:2, q:"Explain estimation method for analysis of simulation output", occ:[{year:"2015 F", marks:"2+3", q:"Why simulation output is analyzed? Explain estimation method for analysis of simulation output"}, {year:"2012 C", marks:"", q:"Estimation method in simulation output ~alysis_ I'"}],
   answer:`<h4>Answer</h4>

<h4>The estimation problem</h4>

<p>A simulation produces observations Y&#8321;, Y&#8322;, &#8230;, Y&#8345; of some performance measure. The quantity we want is the <strong>true (expected) value</strong> &#952; = E[Y], and the job of output analysis is to produce (i) a <strong>point estimate</strong> of it and (ii) an <strong>interval estimate</strong> that states how much the point estimate can be trusted.</p>

<h4>1. Point estimation</h4>

<div class="formula-box"><span class="fb-label">Sample mean</span>

&#952;&#770; = (1/n) &#931; Y&#7522;&nbsp;&nbsp;&nbsp;where n is the number of observations AFTER the warm-up period is discarded

Sample variance&nbsp; S&#178; = &#931;(Y&#7522; &#8722; &#952;&#770;)&#178; / (n &#8722; 1)</div>

<p>The mean of the retained observations is the usual point estimate. Two precautions belong to the estimate itself: the warm-up (initial-bias) observations are removed first, and in a terminating simulation the estimator is the mean of <em>independent replications</em> of the whole run rather than the mean over one long run.</p>

<h4>2. Interval estimation</h4>

<div class="formula-box"><span class="fb-label">Confidence interval for the mean</span>

&#952;&#770; &#177; t&#8202;&#945;/2,&#8202;n&#8722;1 &#183; S / &#8730;n&nbsp;&nbsp;&nbsp;(half-width h = t &#183; S/&#8730;n)

95 % confidence, n &#8722; 1 degrees of freedom; t &#8776; z = 1.96 for large n</div>

<p>Interpretation to write down: if the simulation were repeated many times, 95 % of the intervals so constructed would contain the true value &#952;. It is a statement about the <em>procedure</em>, not about one interval.</p>

<h4>3. The independence problem — which method to use</h4>

<table class="comparison-table">

<tr><th>Method</th><th>How it works</th><th>When to use it</th></tr>

<tr><td><strong>Replication method</strong></td><td>Run n independent replications with different random-number streams; each run contributes ONE observation (its own mean). The n means are independent, so the t-interval above is valid.</td><td>Terminating systems, and the safest general choice.</td></tr>

<tr><td><strong>Batch-means method</strong></td><td>Run once for a long time; discard the warm-up; split the rest into k equal batches and use the k batch means as the observations.</td><td>Steady-state systems; batch size must be large enough to make the means nearly independent.</td></tr>

<tr><td><strong>Regenerative method</strong></td><td>Start observations afresh at "regeneration points" where the system probabilistically restarts (e.g. queue empty AND server idle), giving genuinely independent cycles.</td><td>Systems with identifiable regeneration points.</td></tr>

<tr><td><strong>Spectral / autoregressive</strong></td><td>Estimates the autocovariance structure directly and corrects the variance.</td><td>Advanced work; rarely needed on this course.</td></tr>

</table>

<div class="worked">

<div class="worked-head"><span>Estimation in one line of arithmetic</span><span class="meta">5 replications, 95 %</span></div>

<div class="worked-givens">

<div><span>Replication means</span><b>12.5, 14.2, 11.8, 13.6, 12.9 min</b></div>

<div><span>n</span><b>5 &nbsp;(df = 4)</b></div>

<div><span>t&#8202;&#8320;.&#8320;&#8322;&#8325;,&#8324;</span><b>2.776</b></div>

</div>

<ol class="worked-steps">

<li><span class="worked-calc">Point estimate: &#952;&#770; = 65.0 / 5 = 13.0 min</span></li>

<li><span class="worked-calc">S&#178; = 3.50 / 4 = 0.875, so S = 0.9354</span></li>

<li><span class="worked-calc">Half-width = 2.776 &#215; 0.9354 / &#8730;5 = 1.161 min</span></li>

</ol>

<p class="worked-result">Estimated mean wait = <strong>13.0 &#177; 1.16 min</strong>, i.e. the 95 % confidence interval is (11.8, 14.2) min.</p>

</div>

<p><strong>Relative precision and run length:</strong> the half-width is often reported as a percentage of the mean &mdash; here 1.161/13.0 = 8.9 %. If a 5 % half-width were required, the number of replications must be increased: n &#8776; (t&#183;S/h)&#178; = (2.776 &#215; 0.9354/0.65)&#178; &#8776; 16 replications, which is exactly the sort of design question output analysis is asked to answer.</p>`},
  {year:"2015 F", marks:"5", repeats:1, q:"Simulation Run Statistics (Short Note)",
   answer:`<h4>Answer</h4>
<p><strong>Simulation run statistics</strong> are the measures collected during and after simulation runs to evaluate system performance:</p>
<ul>
<li><strong>Mean (Average):</strong> Central tendency of the output measure (e.g., average wait time)</li>
<li><strong>Variance/Standard Deviation:</strong> Spread of results around the mean</li>
<li><strong>Minimum & Maximum:</strong> Range of observed values</li>
<li><strong>Utilization:</strong> Fraction of time a resource (server) is busy</li>
<li><strong>Throughput:</strong> Number of entities processed per unit time</li>
</ul>
<p><strong>Two types:</strong></p>
<ul>
<li><strong>Time-averaged:</strong> Weighted by time duration (e.g., average queue length over 8 hours)</li>
<li><strong>Observation-based:</strong> Simple average of individual observations (e.g., average wait per customer)</li>
</ul>
<p>These statistics are used with confidence intervals from replications to make decisions about the system.</p>`}
]
};
