window.CHAPTERS = window.CHAPTERS || {};
window.CHAPTERS[3] = {
learn: `
<h2>3.1 A Pure Pursuit Problem</h2>
<p>A <strong>pure pursuit problem</strong> is a scenario where a vehicle or robot follows a pre-defined path by constantly adjusting its direction to minimize the distance between itself and the target. The target is <em>not aware</em> of the pursuer (unlike "hot pursuit").</p>

<div class="example-box">
<h4>Classic Example: Fighter Aircraft Chasing Bomber</h4>
<p>A fighter aircraft sights an enemy bomber and flies directly towards it to catch up and destroy it. We must determine the course of attack and how long the fighter takes.</p>
</div>

<h3>Assumptions</h3>
<ol>
<li>Both pursuer and bomber fly in the <strong>same 2D plane</strong></li>
<li>The fighter speed is <strong>constant</strong></li>
<li>The target path is <strong>known</strong></li>
<li>Minimum distance to fire a missile = <strong>10 units</strong></li>
<li>If target is not caught within given time → target <strong>escapes</strong></li>
<li>Initial coordinates of fighter are known</li>
</ol>

<h3>Mathematical Formulation</h3>
<p>At time t=0: Fighter at (0, 50), Target on x-axis at (90, 0)</p>
<div class="formula-box">
d = √((x_b(t) - x_f(t))² + (y_b(t) - y_f(t))²)<br>
sin θ = (y_b(t) - y_f(t)) / d<br>
cos θ = (x_b(t) - x_f(t)) / d
</div>
<p><strong>Next position of fighter at time (t+1):</strong></p>
<div class="formula-box">
x_f(t+1) = x_f(t) + V_p × cos θ<br>
y_f(t+1) = y_f(t) + V_p × sin θ
</div>
<p>where V_p = velocity of fighter. The angle must match the axis: cos θ is the fraction of the speed along <strong>x</strong> — it is (x_b − x_f)/d — and sin θ is the fraction along <strong>y</strong>, (y_b − y_f)/d. Swapping the two makes the fighter fly away from the bomber, which is the classic mistake in this question.</p>

<div class="worked">
<div class="worked-head"><span>Pure pursuit — one time step, from the initial conditions given above</span><span class="meta">fighter (0, 50) · bomber (90, 0)</span></div>
<div class="worked-givens">
<div><span>Fighter</span><b>(x_f, y_f) = (0, 50)</b></div>
<div><span>Bomber</span><b>(x_b, y_b) = (90, 0)</b></div>
<div><span>Stop rule</span><b>hit if d ≤ 10 units</b></div>
</div>
<ol class="worked-steps">
<li><span class="worked-calc">d = √[(x_b − x_f)² + (y_b − y_f)²]
  = √[(90 − 0)² + (0 − 50)²] = √(8100 + 2500) = √10600 = 102.96 units</span><span class="worked-note">d &gt; 10, so the pursuit continues — the first line of every answer is the distance check.</span></li>
<li><span class="worked-calc">cos θ = (x_b − x_f)/d = 90/102.96  = 0.8742   (share of the speed along x)
sin θ = (y_b − y_f)/d = −50/102.96 = −0.4856  (share along y)</span></li>
<li><span class="worked-calc">x_f(t+1) = 0   + V_p × 0.8742  = +0.8742 V_p
y_f(t+1) = 50 + V_p × (−0.4856) = 50 − 0.4856 V_p</span><span class="worked-note">With V_p = 20 units per step this is (17.48, 40.29) — substitute the speed your question gives.</span></li>
<li><span class="worked-calc">New distance: √[(90 − 0.8742V_p)² + (0 − (50 − 0.4856V_p))²]</span><span class="worked-note">Recompute d each step; repeat until d ≤ 10 (hit) or the allowed time runs out (escape). This is the whole simulation loop.</span></li>
</ol>
<div class="worked-result"><span>d = 102.96 units, still closing</span><b>cos θ = 0.8742 · sin θ = −0.4856</b></div>
</div>

<h3>Algorithm</h3>
<ul>
<li>If distance ≤ <strong>10 units</strong> → <strong>bomber is shot down</strong></li>
<li>If the fighter has not closed to 10 units within the time allowed → <strong>bomber escapes</strong></li>
<li>Otherwise → recalculate θ from the new positions and take another step</li>
</ul>
<p>If the target flies along a straight line, the problem can be solved <strong>analytically</strong>. If the path is curved, <strong>simulation</strong> is needed.</p>

<h2>3.2 Continuous System Models</h2>
<p><strong>Continuous systems</strong> are those where system variables change continuously according to time. Quantities like water level, pressure, temperature, and flow rate are simulated by mathematical models through <strong>differential equations</strong>.</p>

<h3>Advantages of Differential Equations for Continuous Simulation</h3>
<ol>
<li><strong>Dynamic Modeling:</strong> Can model how quantities change with respect to time/space (temperature, population growth, circuits)</li>
<li><strong>Continuity:</strong> Track quantities that change continuously (liquid flow, heat distribution)</li>
<li><strong>Predictive Power:</strong> Once the differential equation is known, future behavior can be predicted</li>
<li><strong>Broad Application:</strong> Engineering, physics, biology, economics</li>
</ol>

<h2>3.3 Analog Computer</h2>
<p>An analog computer processes <strong>continuous data/signals</strong> using physical components such as electrical, mechanical, or hydraulic components.</p>
<p><strong>Examples:</strong> OPAM (Operational Amplifier), Mechanical Integrators, Abacus, Analog Speedometer</p>
<h3>Features</h3>
<ul>
<li>Non-programmable</li>
<li>Highly accurate but not highly precise</li>
<li>Real-time processing/simulation</li>
<li>Uses continuous signals (voltage or current)</li>
</ul>

<h2>3.4 Analog Methods — Components</h2>
<p>The various components used in analog computers to simulate continuous systems:</p>
<table class="comparison-table">
<tr><th>Component</th><th>Symbol</th><th>Function</th></tr>
<tr><td><strong>Summer (Adder)</strong></td><td>Σ</td><td>Adds multiple input signals</td></tr>
<tr><td><strong>Integrator</strong></td><td>∫</td><td>Integrates signal over time</td></tr>
<tr><td><strong>Scale Factor</strong></td><td>K</td><td>Multiplies signal by a constant</td></tr>
<tr><td><strong>Inverter</strong></td><td>-1</td><td>Reverses the sign of signal</td></tr>
</table>

<h3>Automobile Suspension System</h3>
<p>A key component connecting wheels to the vehicle body, absorbing shock on rough surfaces.</p>
<div class="formula-box">MẌ + DẊ + Kx = Kf(t)</div>
<p>where M = mass, D = damping coefficient, K = spring constant, f(t) = force, x = displacement</p>
<p>Rearranging: <strong>MẌ = Kf(t) - DẊ - Kx</strong></p>
<p><strong>Block diagram:</strong> 3 variables are added with a summer to produce MẌ → scale by 1/M to get Ẍ → integrator gives Ẋ → inverter gives -Ẋ → integrator gives -x → inverter gives x.</p>

<h3>Computer Model of Liver</h3>
<p>Thyroxine enters blood → carried to liver → liver converts to iodine → iodine absorbed by bile</p>
<div class="formula-box">
Ẋ₁ = K₂₁X₂ - K₁₂X₁<br>
Ẋ₂ = K₁₂X₁ - (K₂₁ + K₂₃)X₂<br>
Ẋ₃ = K₂₃X₂
</div>
<p>3 integrators are used, each solving one differential equation. Necessary scaling is also applied.</p>

<h2>3.5 Hybrid Simulation</h2>
<p>When a system is <strong>neither purely continuous nor purely discrete</strong>, we need both analog and digital computers. A hybrid computer exhibits features of both.</p>
<div class="concept-box warn">
<h4>Key Challenge</h4>
<p>Hybrid simulation requires high-speed <strong>DAC</strong> (Digital to Analog Converter) and <strong>ADC</strong> (Analog to Digital Converter).</p>
</div>
<p><strong>Example:</strong> An artificial satellite follows equations of motion (continuous) but also requires digital signal processing.</p>

<h2>3.6 Feedback Systems</h2>
<p>Systems in which the <strong>output is sampled and fed back to the input</strong>.</p>
<div class="example-box">
<h4>Example: Home Heating System</h4>
<p>A thermostat-controlled furnace: The furnace heats the room (output = room temperature). The thermostat measures temperature and turns furnace ON/OFF based on whether temperature is below/above the setting.</p>
</div>

<h3>Types of Feedback</h3>
<table class="comparison-table">
<tr><th>Feature</th><th>Positive Feedback</th><th>Negative Feedback</th></tr>
<tr><td><strong>Phase</strong></td><td>In phase with original input</td><td>Out of phase with original input</td></tr>
<tr><td><strong>Effect</strong></td><td>Increases system gain</td><td>Decreases system gain</td></tr>
<tr><td><strong>OPAM terminal</strong></td><td>Output fed to non-inverting terminal</td><td>Output fed to inverting terminal</td></tr>
<tr><td><strong>Stability</strong></td><td>Can make system unstable</td><td>Stabilizes the system</td></tr>
<tr><td><strong>Example</strong></td><td>Oscillator circuits, microphone squealing</td><td>Thermostat, cruise control</td></tr>
</table>

<h2>3.7 Differential & Partial Differential Equations</h2>
<p><strong>Ordinary Differential Equation (ODE):</strong> Contains derivatives of dependent variable with respect to ONE independent variable.</p>
<div class="formula-box">MẌ + DẊ + Kx = Kf(t) (Second-order ODE)</div>
<p><strong>Partial Differential Equation (PDE):</strong> Contains derivatives with respect to MORE THAN ONE independent variable.</p>
<div class="formula-box">∂²u/∂x² + ∂²u/∂y² = 0 (Laplace equation)</div>
<h3>Engineering Uses</h3>
<ul>
<li>Most physical & chemical processes involve rate of change → requires differential equations</li>
<li>Used to understand general effects of growth rate/trends</li>
<li>Heat conduction, fluid dynamics, electromagnetic fields, structural mechanics</li>
</ul>
`,

quiz: [
  {q:"In pure pursuit, the target is:", options:["Aware of pursuer","Not aware of pursuer","Stationary","Moving randomly"], answer:1, explanation:"In pure pursuit, the target is NOT aware of the pursuer (unlike 'hot pursuit' where the target knows)."},
  {q:"If the fighter-bomber distance is ≤ 100m, what happens?", options:["Fighter escapes","Bomber escapes","Bomber is shot down","Both retreat"], answer:2, explanation:"If distance ≤ 100m (or 10 units), the fighter can fire a missile and the bomber is shot down."},
  {q:"Which component in analog computer reverses signal sign?", options:["Summer","Integrator","Scale factor","Inverter"], answer:3, explanation:"An inverter reverses the sign of the signal, multiplying by -1."},
  {q:"The automobile suspension equation is:", options:["MẌ + DẊ + Kx = Kf(t)","MẊ + Kx = f(t)","Ẍ = Kf(t)","MẌ = DẊ"], answer:0, explanation:"The suspension system is modeled by MẌ + DẊ + Kx = Kf(t) where M=mass, D=damping, K=spring constant."},
  {q:"How many integrators are used in the Computer Model of Liver?", options:["1","2","3","4"], answer:2, explanation:"3 integrators are used — each solving one of the three differential equations for blood (X₁), liver (X₂), and bile (X₃)."},
  {q:"Hybrid simulation requires:", options:["Only analog computers","Only digital computers","DAC and ADC converters","No special hardware"], answer:2, explanation:"Hybrid simulation needs high-speed DAC (Digital-to-Analog) and ADC (Analog-to-Digital) converters."},
  {q:"A thermostat-controlled heating system is an example of:", options:["Positive feedback","Negative feedback","No feedback","Open-loop system"], answer:1, explanation:"A thermostat uses negative feedback — it turns off the furnace when temperature exceeds the setpoint, stabilizing the system."},
  {q:"Positive feedback causes:", options:["System stability","Decreased gain","Increased gain","No effect"], answer:2, explanation:"Positive feedback increases the gain of the system rather than the gain without feedback."},
  {q:"∂²u/∂x² + ∂²u/∂y² = 0 is a:", options:["ODE","PDE","Algebraic equation","Integral equation"], answer:1, explanation:"This is a Partial Differential Equation (Laplace equation) because it has derivatives with respect to more than one independent variable (x and y)."},
  {q:"An analog computer is:", options:["Programmable","Non-programmable","Digital","Discrete"], answer:1, explanation:"Analog computers are non-programmable. They use physical components and continuous signals for real-time processing."}
],

past: [
  {year:"2019 F", marks:"6", repeats:5, q:"Explain feedback system with its application.", occ:[{year:"2014 F, 2012 C,, 2010 F, 2010 C", marks:"5", q:"Short Note: Feedback system"}, {year:"2015 F", marks:"5", q:"Explain feedback system with suitable example"}, {year:"2015 F", marks:"5", q:"Explain feedback system with suitable example"}, {year:"2011 F", marks:"4", q:"Explain feedback system and hybrid system with suitable example"}, {year:"2011 C", marks:"5+3+2", q:"What are the applications of feedback system? Explain computer model to represent it. Show GPSS block diagram"}],
   answer:`<h4>Answer</h4>
<p>A <strong>feedback system</strong> is one where the output is sampled and fed back to the input to control system behavior.</p>
<h4>Types</h4>
<p><strong>Positive Feedback:</strong> Output is in phase with input → increases system gain. Fed to non-inverting terminal of OPAM. Can make system unstable.</p>
<p><strong>Negative Feedback:</strong> Output is out of phase with input → decreases system gain. Fed to inverting terminal. Stabilizes the system.</p>
<h4>Application: Home Heating System</h4>
<p>A thermostat-controlled furnace is a <strong>negative feedback system</strong>:</p>
<ol>
<li>The furnace heats the room (output = room temperature)</li>
<li>Thermostat measures current temperature</li>
<li>If temperature < setpoint → furnace turns ON</li>
<li>If temperature > setpoint → furnace turns OFF</li>
<li>This creates a stable temperature around the setpoint</li>
</ol>
<h4>Application: Aircraft Autopilot</h4>
<p>Gyroscope detects difference between actual and desired heading → sends signal to move control surfaces → airframe steers toward desired heading. This is a negative feedback loop that keeps the aircraft on course.</p>`},
  {year:"2014 F", marks:"5", repeats:3, q:"Explain continuous system simulation with suitable example.", occ:[{year:"2019 F", marks:"5", q:"Explain the concept of continuous system simulation"}, {year:"2019 F", marks:"5", q:"Explain the concept of continuous system simulation"}, {year:"2011 F", marks:"5", q:"Short Note: Continuous Simulation"}],
   answer:`<h4>Answer</h4>
<p><strong>Continuous System Simulation</strong> involves modeling systems where variables change continuously over time using differential equations.</p>
<p><strong>Characteristics:</strong> Variables change smoothly, modeled by ODEs/PDEs, simulated using analog/digital/hybrid computers.</p>
<p><strong>Example — Automobile Suspension System:</strong></p>
<p>The suspension absorbs shock during vehicle movement on rough surfaces.</p>
<div class="formula-box">MẌ + DẊ + Kx = Kf(t)</div>
<p>where M = mass, D = damping coefficient, K = spring constant, x = displacement, f(t) = road surface force.</p>
<p><strong>Simulation using analog components:</strong></p>
<ol>
<li>Three signals (MẌ, DẊ, Kx) are added using a <strong>summer</strong></li>
<li>Output scaled by 1/M to produce Ẍ</li>
<li>Passed through <strong>integrator</strong> to get Ẋ</li>
<li>Through <strong>inverter</strong> to get -Ẋ</li>
<li>Through second <strong>integrator</strong> to get -x</li>
<li>Through <strong>inverter</strong> to get x</li>
</ol>`},
  {year:"2014 F", marks:"5", repeats:3, q:"Why are differential equations so important in simulation? Explain with example.", occ:[{year:"2012 C, 2010 C", marks:"5", q:"Explain the need of differential equation in simulation with an example"}, {year:"2015 F", marks:"5", q:"Short Note: Differential equation"}],
   answer:`<h4>Answer</h4>
<p>Differential equations are crucial in simulation because:</p>
<ol>
<li><strong>Dynamic Modeling:</strong> They model how quantities change with respect to time/space (temperature changes, population growth, circuit behavior)</li>
<li><strong>Continuity:</strong> Continuous systems like liquid flow and heat distribution involve quantities that change continuously — tracked by differential equations</li>
<li><strong>Predictive Power:</strong> Once the DE is known, it can be solved numerically or analytically to predict future behavior from initial conditions</li>
<li><strong>Broad Application:</strong> Used in engineering, physics, biology, economics — virtually every field</li>
</ol>
<p><strong>Example — Water Reservoir:</strong></p>
<div class="formula-box">dh(t)/dt = (Q_in(t) - Q_out(t)) / A(h(t))</div>
<p>where h(t) = water level at time t, Q_in = inlet rate, Q_out = outlet rate, A(h) = cross-sectional area at height h. This ODE lets us simulate and predict water levels over time.</p>
<p><strong>Example — Suspension System:</strong> MẌ + DẊ + Kx = Kf(t) describes the displacement of a vehicle over rough terrain, allowing engineers to optimize suspension parameters.</p>`},
  {year:"2025 M", marks:"4", repeats:2, q:"Describe the pure pursuit problem in continuous systems.", occ:[{year:"2012 C", marks:"5", q:"Explain pure pursuit problem"}, {year:"2010 F", marks:"6", q:"Discuss a pure pursuit problem with a suitable example"}],
   answer:`<h4>Answer</h4>
<p>The <strong>pure pursuit problem</strong> is a classic continuous system simulation where a pursuer (e.g., fighter aircraft) constantly adjusts its direction to fly directly toward a moving target (e.g., bomber).</p>
<p><strong>Setup:</strong> Fighter at (0, 50), Bomber on x-axis. Fighter always points toward bomber's current position.</p>
<p><strong>Assumptions:</strong> Same 2D plane, constant fighter speed, known target path, minimum firing distance = 10 units.</p>
<p><strong>Formulas:</strong></p>
<ul>
<li>Distance: d = √((x_b - x_f)² + (y_b - y_f)²)</li>
<li>sin θ = (y_b - y_f)/d, cos θ = (x_b - x_f)/d</li>
<li>x_f(t+1) = x_f(t) + V_p × sin θ</li>
<li>y_f(t+1) = y_f(t) + V_p × cos θ</li>
</ul>
<p>If d ≤ 100m → bomber shot down. If d > 1000m → bomber escapes. If target path is straight → analytical solution. If curved → simulation needed.</p>`},
  {year:"2025 M", marks:"8", repeats:1, q:"Compare analog vs. hybrid simulation methods, highlighting their use in solving differential equations.", occ:[{year:"2025 M", marks:"8", q:"Compare analog vs. hybrid simulation methods"}],
   answer:`<h4>Answer</h4>
<table>
<tr><th>Feature</th><th>Analog Simulation</th><th>Hybrid Simulation</th></tr>
<tr><td><strong>Nature</strong></td><td>Purely continuous signals</td><td>Combination of continuous + discrete</td></tr>
<tr><td><strong>Components</strong></td><td>Summer, Integrator, Inverter, Scale factor</td><td>Analog + Digital computer with DAC/ADC</td></tr>
<tr><td><strong>Programmability</strong></td><td>Non-programmable</td><td>Partially programmable (digital part)</td></tr>
<tr><td><strong>Processing</strong></td><td>Real-time continuous</td><td>Both real-time and stored-program</td></tr>
<tr><td><strong>Accuracy</strong></td><td>High accuracy, limited precision</td><td>Better precision (digital processing)</td></tr>
<tr><td><strong>Differential Equations</strong></td><td>Solved directly by physical components</td><td>Continuous part by analog, complex logic by digital</td></tr>
<tr><td><strong>Example</strong></td><td>MẌ + DẊ + Kx = Kf(t) — suspension system</td><td>Satellite simulation (equations of motion + digital control)</td></tr>
<tr><td><strong>Limitation</strong></td><td>Cannot handle digital/discrete logic</td><td>Requires high-speed DAC and ADC</td></tr>
</table>
<p><strong>For solving differential equations:</strong></p>
<ul>
<li><strong>Analog:</strong> Each term of the equation is represented by a physical component. Integrators solve ∫, summers combine terms, scale factors apply constants. Output is a continuous voltage representing the solution.</li>
<li><strong>Hybrid:</strong> The continuous differential equation part is handled by analog components, while boundary conditions, logic decisions, and data logging are handled by the digital computer. This gives the real-time speed of analog with the flexibility of digital.</li>
</ul>`},
  {year:"2015 F", marks:"5", repeats:1, q:"Explain how continuous model can be solved numerically with an example", occ:[{year:"2015 F", marks:"5", q:"Explain how continuous model can be solved numerically with an example"}],
   answer:`<h4>Answer</h4>

<h4>Why a continuous model has to be solved numerically</h4>

<p>A continuous model describes the system by <strong>differential equations</strong>. The first step is always to write it in <strong>state form</strong> — first-order, one equation per state variable:</p>

<div class="formula-box"><span class="fb-label">State form</span>

dx/dt = f(x, t),&nbsp;&nbsp; x(0) = x&#8320;

A higher-order equation is reduced first:&nbsp; x&#8243; = g(x, x&#8242;, t) &nbsp;&#8594;&nbsp; x&#8321; = x, &#160;x&#8322; = x&#8242;, &#160;x&#8321;&#8242; = x&#8322;, &#160;x&#8322;&#8242; = g(x&#8321;, x&#8322;, t)</div>

<p>Only a few equations have a closed-form solution, so the trajectory is obtained by <strong>numerical integration</strong>: from the known state at time t&#8345;, step forward by a small interval h and use the derivative to predict the state at t&#8345;&#8330;&#8321;. The process repeats until the required time.</p>

<table class="comparison-table">

<tr><th>Method</th><th>Formula</th><th>Accuracy</th></tr>

<tr><td><strong>Euler</strong> (first order)</td><td>y&#8345;&#8330;&#8321; = y&#8345; + h&#183;f(t&#8345;, y&#8345;)</td><td>O(h&#178;) per step, O(h) overall — simplest, needs a small h</td></tr>

<tr><td><strong>Heun / improved Euler</strong></td><td>Euler predicts, then the slopes at both ends of the step are averaged</td><td>O(h&#179;) per step, O(h&#178;) overall</td></tr>

<tr><td><strong>Runge&#8211;Kutta 4</strong></td><td>y&#8345;&#8330;&#8321; = y&#8345; + (h/6)(k&#8321; + 2k&#8322; + 2k&#8323; + k&#8324;), with four slope evaluations per step</td><td>O(h&#8309;) per step, O(h&#8308;) overall — the standard choice</td></tr>

</table>

<div class="worked">

<div class="worked-head"><span>Euler solution of the continuous model dy/dt = &#8722;y, y(0) = 1</span><span class="meta">h = 0.1, five steps</span></div>

<div class="worked-givens">

<div><span>Equation</span><b>dy/dt = &#8722;y</b></div>

<div><span>Initial condition</span><b>y(0) = 1</b></div>

<div><span>Step size</span><b>h = 0.1</b></div>

<div><span>Steps</span><b>5 &#8594; t = 0.5</b></div>

</div>

<ol class="worked-steps">

<li><span class="worked-calc">Recursion: y&#8345;&#8330;&#8321; = y&#8345; + h(&#8722;y&#8345;) = y&#8345;(1 &#8722; h) = 0.9 y&#8345;</span><span class="worked-note">Because the equation is linear, the Euler step collapses to a simple multiplication by 0.9.</span></li>

<li><span class="worked-calc">Step 1: y&#8321; = 1 + 0.1(&#8722;1) = 0.90000

Step 2: y&#8322; = 0.9 + 0.1(&#8722;0.9) = 0.81000

Step 3: y&#8323; = 0.81 &#8722; 0.081 = 0.72900

Step 4: y&#8324; = 0.729 &#8722; 0.0729 = 0.65610

Step 5: y&#8325; = 0.6561 &#8722; 0.06561 = 0.59049</span></li>

<li><span class="worked-calc">Comparison with the exact solution y(t) = e&#8315;&#7511;:</span>

<table>

<tr><th>t</th><th>Euler y&#8345;</th><th>Exact e&#8315;&#7511;</th><th>Error</th></tr>

<tr><td>0.0</td><td>1.00000</td><td>1.00000</td><td>0.00000</td></tr>

<tr><td>0.1</td><td>0.90000</td><td>0.90484</td><td>0.00484</td></tr>

<tr><td>0.2</td><td>0.81000</td><td>0.81873</td><td>0.00873</td></tr>

<tr><td>0.3</td><td>0.72900</td><td>0.74082</td><td>0.01182</td></tr>

<tr><td>0.4</td><td>0.65610</td><td>0.67032</td><td>0.01422</td></tr>

<tr><td>0.5</td><td><strong>0.59049</strong></td><td>0.60653</td><td><strong>0.01604</strong></td></tr>

</table></li>

<li><span class="worked-calc">Relative error at t = 0.5: 0.01604 / 0.60653 = 2.6 %</span><span class="worked-note">Euler always under-shoots here because every step uses the slope from the START of the interval, when the curve is steepest. Halving h to 0.05 gives y(0.5) = 0.95&#185;&#8304; = 0.59874, i.e. an error of 1.28 % — the error falls in proportion to h, exactly as O(h) predicts.</span></li>

</ol>

<p class="worked-result">Numerical solution: y(0.5) &#8776; <strong>0.5905</strong> instead of the exact 0.6065 — error 0.0160 (2.6 %)</p>

</div>

<p><strong>Practical points to write down:</strong></p>

<ul>

<li><strong>Step size is a trade-off.</strong> Too large: truncation error grows and the solution can become unstable. Too small: round-off error accumulates and the computing cost rises. Stability for Euler requires h|&#8706;f/&#8706;y| &#8804; 2.</li>

<li><strong>Higher-order methods buy accuracy cheaply.</strong> RK4 with h = 0.1 is far more accurate than Euler with the same h, which is why every continuous simulation language offers RK4 as a selectable method.</li>

<li><strong>Stiff systems</strong> (very different time constants) need implicit methods such as Gear's, because an explicit method would be forced to use a tiny step.</li>

<li><strong>Events and thresholds</strong> must be handled outside the integrator: the state is monitored between steps and, when a limit is crossed, the exact crossing time is found and the step restarted.</li>

<li><strong>This is what a continuous simulation language does internally.</strong> CSSL, CSMP, ACSL and Simulink let the modeller <em>write the equations</em>; the package chooses the integrator, the step size and the output interval. DYNAMO uses a fixed step and is a special case.</li>

</ul>`},
  {year:"2015 F", marks:"5", repeats:1, q:"Explain the analogy method of system study with suitable example", occ:[{year:"2015 F", marks:"5", q:"Explain the analogy method of system study with suitable example"}],
   answer:`<h4>Answer</h4>

<h4>The analogy method</h4>

<p>In the analogy method the real system is never built. Instead a <strong>different physical system that obeys the same mathematical equations</strong> is constructed and studied, and its behaviour is translated back into the language of the original system. Two systems are analogues when their describing equations have the same form — then a measurement on the cheap system is a measurement on the real one.</p>

<table class="comparison-table">

<tr><th>Type of analogy</th><th>Idea</th><th>Example</th></tr>

<tr><td><strong>Direct analogy</strong></td><td>The same equation holds term by term, only the physical variables change</td><td>Mechanical Mx&#8243; + Cx&#8242; + Kx = F&#8202;(t) against the electric circuit Lq&#8243; + Rq&#8242; + q/C = E&#8202;(t)</td></tr>

<tr><td><strong>Indirect analogy</strong></td><td>A transformation links equations of different form (force&#8211;voltage, force&#8211;current)</td><td>Hydraulic, thermal and fluid networks represented by an equivalent electrical network</td></tr>

<tr><td><strong>Analog computer</strong></td><td>The equations are wired directly on operational amplifiers acting as integrators and summers</td><td>The three-compartment model in the next question</td></tr>

</table>

<h4>Worked example — a mass&#8211;spring&#8211;damper and its electrical analogue</h4>

<div class="worked">

<div class="worked-head"><span>Correspondence of the two systems</span><span class="meta">direct analogy</span></div>

<ol class="worked-steps">

<li><span class="worked-calc">Mechanical system (mass M, damper C, spring K, drive force F):

M&#8202;x&#8243; + C&#8202;x&#8242; + K&#8202;x = F&#8202;(t)</span></li>

<li><span class="worked-calc">Series RLC circuit (inductance L, resistance R, capacitance C&#8320;, applied voltage E, charge q):

L&#8202;q&#8243; + R&#8202;q&#8242; + (1/C&#8320;)&#8202;q = E&#8202;(t)</span></li>

<li><span class="worked-calc">The two equations are identical in form, so we may substitute:

displacement x &#8596; charge q&nbsp;&nbsp;&#183;&nbsp;&nbsp;velocity x&#8242; &#8596; current i = q&#8242;&nbsp;&nbsp;&#183;&nbsp;&nbsp;force F &#8596; voltage E

mass M &#8596; inductance L&nbsp;&nbsp;&#183;&nbsp;&nbsp;damping C &#8596; resistance R&nbsp;&nbsp;&#183;&nbsp;&nbsp;stiffness K &#8596; 1/C&#8320;</span></li>

<li><span class="worked-calc">Build the circuit, scale the variables (&#945;&#183;x = q, &#946;&#183;F = E), excite it with E(t) and record the current. The recorded curve is the vibration of the mass, and the resonance frequency is read off directly as &#969; = 1/&#8730;(LC&#8320;) or &#8730;(K/M).</span><span class="worked-note">Scaling is essential: the physical ranges of the two systems are wildly different, so each variable is multiplied by its own scale factor so that the electrical quantity stays inside the amplifier's &#177;10 V range.</span></li>

</ol>

<p class="worked-result">The mechanical response is measured on an electrical circuit — no mass, spring or damper is built.</p>

</div>

<p><strong>Advantages:</strong> the analogue is cheap and can be built long before the real system exists; parameters are changed by turning a potentiometer or swapping a component instead of rebuilding hardware; dangerous and expensive tests become safe; and the response appears <em>continuously and in real time</em>, which is ideal for control studies.</p>

<p><strong>Limitations:</strong> accuracy is limited by component tolerances and by amplifier drift; scaling errors are easy to make and hard to spot; it is difficult to represent nonlinearities, and impossible to represent discrete events or stochastic behaviour. For these reasons digital simulation has replaced the analogy method except in specialist real-time control work — but the <em>idea</em> of an analogue survives inside the analog-computer style of modelling used in the next question.</p>`},
  {year:"2015 F", marks:"5", repeats:1, q:"Illustrate the possible event interactions in Hybrid Simulation", occ:[{year:"2015 F", marks:"5", q:"State some types of Simulation· languages. Illustrate the possible event interactions in Hybrid Simulation"}],
   answer:`<h4>Answer</h4>

<h4>Hybrid simulation</h4>

<p>A <strong>hybrid model</strong> contains both continuous parts (differential equations, integrated in steps of &#916;t) and discrete parts (events that change the state instantly). The two parts are not independent: they interact, and it is exactly those interactions that the question is about.</p>

<h4>Possible event interactions</h4>

<ol>

<li><strong>Discrete event changes a continuous state (state jump).</strong> An event sets the state variable to a new value immediately — the trajectory has a vertical jump. <em>Example:</em> a tank that is emptied instantaneously when a valve is opened, or a cash balance that is credited on payday.</li>

<li><strong>Discrete event changes a derivative (parameter event).</strong> The state stays continuous but its rate of change changes abruptly. <em>Example:</em> a machine breaks down, so the inflow rate Q&#8202;in in dh/dt = Q&#8202;in/A drops to zero; the level keeps its value but the slope changes.</li>

<li><strong>Continuous variable crossing a threshold causes a discrete event (state event).</strong> The state is monitored during integration; when it reaches a limit, an event is scheduled or fired. <em>Example:</em> the tank level reaching the overflow mark and tripping an alarm; a thermostat switching the heater off when the temperature reaches a set point.</li>

<li><strong>Discrete event changes the model structure (topology event).</strong> The number or form of the equations itself changes. <em>Example:</em> the second server in a repair shop is commissioned when the queue of waiting machines exceeds five, adding a term to the throughput equation.</li>

<li><strong>Continuous variable controls a discrete decision (endogenous, self-induced event).</strong> A route or a service discipline depends on a continuous quantity. <em>Example:</em> in a hybrid bank model the queue switches from FIFO to VIP-priority when the average waiting time crosses ten minutes.</li>

<li><strong>Exogenous event from outside the model.</strong> An arrival, a scheduled price change or an operator command enters from the environment and disturbs both parts at once.</li>

<li><strong>Interaction through the clock itself.</strong> The discrete part decides <em>where</em> the continuous integrator may step and <em>when</em> integration must be interrupted; the continuous part in turn decides which event the discrete part must schedule next. This two-way dependency is what makes hybrid models difficult.</li>

<li><strong>Simultaneous and near-simultaneous events.</strong> Two events may fall at the same instant or within one integration step. Their order then changes the result. <em>Example:</em> a machine fails at the very moment its repair is completed.</li>

</ol>

<h4>Example that combines all of them — a tank with a level-controlled pump</h4>

<p>The level h(t) is continuous: dh/dt = (Q&#8202;pump &#8722; Q&#8202;out)/A. The pump is discrete: it is switched ON when h falls to 20 % and OFF when h reaches 85 %. As the level falls through 20 % an event changes Q&#8202;pump from 0 to Q&#8202;p&#8202;ump (interaction 2 and 3); the rise is then continuous until the 85 % crossing fires the OFF event; a valve failure is an exogenous event (6); and if the pump capacity is halved while the tank is filling, the model structure is reinterpreted (4).</p>

<h4>Why it matters in practice</h4>

<p>Event detection must be precise: the integrator has to step <em>exactly</em> to the crossing time (by interpolating the state and re-stepping from there), otherwise the event is missed or fires late. Step-size control is therefore tied to root-finding on the threshold functions. <strong>Chattering</strong> (also called Zeno behaviour) happens when events fire faster and faster — a level oscillating about its set point — and needs a minimum-dwell-time rule. Processing events one integration step late is the classic hybrid-model bug.</p>`},
  {year:"2012 C", marks:"5", repeats:1, q:"Solve equations by analog method: X₁′= −K₁₂X₁ + K₂₁X₂; X₂′= K₁₂X₁ − (K₂₁+K₂₃)X₂; X₃′= K₂₃X₂",
   answer:`<h4>Answer</h4>

<p>The three given equations are a <strong>compartment (linear multi-state) model</strong> — three state variables with constant transfer coefficients. Solving them "by the analog method" means wiring an analog computer so that the equations are satisfied continuously.</p>

<div class="formula-box"><span class="fb-label">Given model</span>

X&#8321;&#8242; = &#8722;K&#8321;&#8322;X&#8321; + K&#8322;&#8321;X&#8322;

X&#8322;&#8242; = &#160;&#160;K&#8321;&#8322;X&#8321; &#8722; (K&#8322;&#8321; + K&#8322;&#8323;)X&#8322;

X&#8323;&#8242; = &#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;K&#8322;&#8323;X&#8322;

Mass balance check: X&#8321; + X&#8322; + X&#8323; = constant, so no material is created or destroyed.</div>

<h4>1. Elements needed</h4>

<table class="comparison-table">

<tr><th>Analog element</th><th>Symbol</th><th>Job in this model</th></tr>

<tr><td>Integrator (summing integrator)</td><td>&#8747;</td><td>Produces &#8722;X&#8342; from X&#8342;&#8242; and applies the initial condition</td></tr>

<tr><td>Coefficient potentiometer</td><td>&#9675; with a fraction</td><td>Multiplies a variable by K&#8321;&#8322;, K&#8322;&#8321;, K&#8322;&#8323;</td></tr>

<tr><td>Summing inverter</td><td>&#8721; with unity gain</td><td>Adds the incoming terms and corrects the algebraic signs</td></tr>

<tr><td>IC (initial condition) logic</td><td>IC</td><td>Loads X&#8321;(0), X&#8322;(0), X&#8323;(0) before a run begins</td></tr>

</table>

<h4>2. Block diagram</h4>

<div class="code-block">        POT K&#8321;&#8322;                     SUMMING INVERTER

 X&#8321; ──&#9675;&#9675;&#9675;&#9654; ─&#9484;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9488;              INTEGRATOR

  &#9650;                &#9474;  &#8722;K&#8321;&#8322;X&#8321; + K&#8322;&#8321;X&#8322;  &#9474;&#9472;&#9654; &#9484;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9488; ──&#9654; &#8722;X&#8321;

  &#9474;                &#9492;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9496;              &#9474;  &#8747; dt     &#9474;      ( = X&#8321; inverted )

  &#9474;        POT K&#8322;&#8321;&#9654;   = X&#8321;&#8242;                                &#9474; IC = X&#8321;(0)&#9474;

  &#9474;                                                              &#9492;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9496;

  &#9474;  X&#8321; ──&#9675;&#9675;&#9675;&#9654; ─&#9484;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9488;              INTEGRATOR

  &#9474;  X&#8322; ──&#9675;&#9675;&#9675;&#9654; ─&#9474; K&#8321;&#8322;X&#8321; &#8722; (K&#8322;&#8321;+K&#8322;&#8323;)X&#8322; &#9474;&#9472;&#9654; &#9484;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9488; ──&#9654; &#8722;X&#8322;

  &#9474;      POT K&#8322;&#8323;&#9654;    &#9492;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9496; = X&#8322;&#8242;   &#9474;  &#8747; dt     &#9474;

  &#9474;                                                              &#9474; IC = X&#8322;(0)&#9474;

  &#9474;                                                              &#9492;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9496;

  &#9474;  X&#8322; ──&#9675;&#9675;&#9675;&#9654; &#9484;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9488;              INTEGRATOR

  &#9474;    POT K&#8322;&#8323;     &#9474;        K&#8322;&#8323;X&#8322;           &#9474;&#9472;&#9654; &#9484;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9488; ──&#9654; &#8722;X&#8323;

  &#9492;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9496; = X&#8323;&#8242;   &#9474;  &#8747; dt     &#9474;

                                                                     &#9474; IC = X&#8323;(0)&#9474;

                                                                     &#9492;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9496;</div>

<h4>3. Procedure</h4>

<ol>

<li><strong>Write the model in state form.</strong> It already is: each X&#8342;&#8242; is a linear combination of the state variables.</li>

<li><strong>Wire one integrator per state variable.</strong> Each integrator's <em>input</em> is that variable's derivative and its <em>output</em> is the variable (inverted, which is why analog diagrams alternate between normal and inverted signals).</li>

<li><strong>Form each derivative.</strong> Feed the appropriate variables through coefficient potentiometers into a summing inverter, so the summer output is X&#8342;&#8242;. For X&#8321;&#8242; the potentiometers are set to K&#8321;&#8322; and K&#8322;&#8321;; for X&#8322;&#8242; to K&#8321;&#8322; and (K&#8322;&#8321; + K&#8322;&#8323;); for X&#8323;&#8242; to K&#8322;&#8323;.</li>

<li><strong>Close the loop.</strong> The integrator outputs are the summer inputs — that is what makes the machine a model rather than a calculator.</li>

<li><strong>Set the initial conditions</strong> with the IC logic: X&#8321;(0), X&#8322;(0), X&#8323;(0) are placed on the corresponding integrators.</li>

<li><strong>Release IC and record.</strong> X&#8321;(t), X&#8322;(t) and X&#8323;(t) are read at the integrator outputs; the mass-balance check X&#8321; + X&#8322; + X&#8323; = constant is the built-in validation.</li>

</ol>

<p><strong>Why the diagram is the right answer here:</strong> the analog computer solves the equations <em>simultaneously</em> and in real time, with no numerical integration error apart from amplifier drift — which is precisely why the analogy method was used for compartment and control models before digital machines took over. The same diagram on a digital computer is the CSSL/Simulink block set: three integrators, three gain blocks and three summing junctions.</p>`},
  {year:"2010 F", marks:"4", repeats:1, q:"Represent Ax'' + Bx' + Cx + D = 0 in analog computer block diagram.",
   answer:`<h4>Answer</h4>
<p>Given: <strong>Ax'' + Bx' + Cx + D = 0</strong></p>
<p>Rearranging: <strong>Ax'' = -Bx' - Cx - D</strong></p>
<p>Therefore: <strong>x'' = (-Bx' - Cx - D) / A</strong></p>
<p><strong>Block Diagram Construction:</strong></p>
<ol>
<li>Start with three signals: -Bx', -Cx, and -D</li>
<li>Feed all three into a <strong>Summer (Adder)</strong> → output = -Bx' - Cx - D</li>
<li>Pass through <strong>Scale Factor (1/A)</strong> → output = x'' = (-Bx' - Cx - D)/A</li>
<li>Pass x'' through <strong>Integrator</strong> → output = x'</li>
<li>Pass x' through <strong>Inverter</strong> → output = -x'</li>
<li>Pass -x' through <strong>Scale Factor (B)</strong> → output = -Bx' (feed back to summer)</li>
<li>Pass x' through second <strong>Integrator</strong> → output = x</li>
<li>Pass x through <strong>Inverter</strong> → output = -x</li>
<li>Pass -x through <strong>Scale Factor (C)</strong> → output = -Cx (feed back to summer)</li>
<li>Constant -D is also fed to the summer</li>
</ol>
<p>The feedback loop continuously solves the differential equation in real-time.</p>`}
]
};
