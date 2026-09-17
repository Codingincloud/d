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
d = √((x<sub>b</sub>(t) - x<sub>f</sub>(t))² + (y<sub>b</sub>(t) - y<sub>f</sub>(t))²)<br>
sin θ = (y<sub>b</sub>(t) - y<sub>f</sub>(t)) / d<br>
cos θ = (x<sub>b</sub>(t) - x<sub>f</sub>(t)) / d
</div>
<p><strong>Next position of fighter at time (t+1):</strong></p>
<div class="formula-box">
x<sub>f</sub>(t+1) = x<sub>f</sub>(t) + V<sub>p</sub> × cos θ<br>
y<sub>f</sub>(t+1) = y<sub>f</sub>(t) + V<sub>p</sub> × sin θ
</div>
<p>where V<sub>p</sub> = velocity of fighter. The angle must match the axis: cos θ is the fraction of the speed along <strong>x</strong> — it is (x<sub>b</sub> − x<sub>f</sub>)/d — and sin θ is the fraction along <strong>y</strong>, (y<sub>b</sub> − y<sub>f</sub>)/d. Swapping the two makes the fighter fly away from the bomber, which is the classic mistake in this question.</p>

<div class="worked">
<div class="worked-head"><span>Pure pursuit — one time step, from the initial conditions given above</span><span class="meta">fighter (0, 50) · bomber (90, 0)</span></div>

<p class="page-src">Source page: <button class="page-chip" type="button" data-page="n1p22">n1 p22</button></p>
<div class="worked-givens">
<div><span>Fighter</span><b>(x<sub>f</sub>, y<sub>f</sub>) = (0, 50)</b></div>
<div><span>Bomber</span><b>(x<sub>b</sub>, y<sub>b</sub>) = (90, 0)</b></div>
<div><span>Stop rule</span><b>hit if d ≤ 10 units</b></div>
</div>
<ol class="worked-steps">
<li><span class="worked-calc">d = √[(x<sub>b</sub> − x<sub>f</sub>)² + (y<sub>b</sub> − y<sub>f</sub>)²]
  = √[(90 − 0)² + (0 − 50)²] = √(8100 + 2500) = √10600 = 102.96 units</span><span class="worked-note">d &gt; 10, so the pursuit continues — the first line of every answer is the distance check.</span></li>
<li><span class="worked-calc">cos θ = (x<sub>b</sub> − x<sub>f</sub>)/d = 90/102.96  = 0.8742   (share of the speed along x)
sin θ = (y<sub>b</sub> − y<sub>f</sub>)/d = −50/102.96 = −0.4856  (share along y)</span></li>
<li><span class="worked-calc">x<sub>f</sub>(t+1) = 0   + V<sub>p</sub> × 0.8742  = +0.8742 V<sub>p</sub>
y<sub>f</sub>(t+1) = 50 + V<sub>p</sub> × (−0.4856) = 50 − 0.4856 V<sub>p</sub></span><span class="worked-note">With V<sub>p</sub> = 20 units per step this is (17.48, 40.29) — substitute the speed your question gives.</span></li>
<li><span class="worked-calc">New distance: √[(90 − 0.8742V<sub>p</sub>)² + (0 − (50 − 0.4856V<sub>p</sub>))²]</span><span class="worked-note">Recompute d each step; repeat until d ≤ 10 (hit) or the allowed time runs out (escape). This is the whole simulation loop.</span></li>
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

<h3>Analog vs Digital vs Hybrid</h3>
<p>A continuous system can be simulated three ways. The exam asks for this comparison by name, so keep the three columns straight:</p>
<table class="comparison-table">
<tr><th>Feature</th><th>Analog</th><th>Digital</th><th>Hybrid</th></tr>
<tr><td><strong>Built from</strong></td><td>Physical components — adder, integrator, op-amp, potentiometer</td><td>A digital computer + simulation software</td><td>An analog computer with a digital computer attached</td></tr>
<tr><td><strong>Data handled</strong></td><td>Continuous signals (voltage or current)</td><td>Discrete numbers</td><td>Both — continuous signals <em>and</em> discrete numbers</td></tr>
<tr><td><strong>Programmable</strong></td><td>No — the wiring is the program</td><td>Yes — the model is software</td><td>Partly — the digital half is programmed</td></tr>
<tr><td><strong>Accuracy / precision</strong></td><td>Highly accurate, not highly precise</td><td>Highly precise; accuracy limited by round-off</td><td>Analog accuracy on the continuous part, digital precision on the rest</td></tr>
<tr><td><strong>Real-time</strong></td><td>Yes — it runs at real speed</td><td>Not inherently</td><td>Yes, if the digital half keeps up</td></tr>
<tr><td><strong>Interface</strong></td><td>—</td><td>—</td><td>Needs high-speed <strong>DAC</strong> and <strong>ADC</strong></td></tr>
<tr><td><strong>Examples</strong></td><td>Abacus, analog speedometer, mechanical integrator</td><td>GPSS, SIMSCRIPT, CSSL packages</td><td>Artificial-satellite simulation (continuous motion + digital control)</td></tr>
</table>

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

<figure class="figure-wrap">

<svg class="figure wide" viewBox="0 0 900 342" role="img" aria-label="Analog-computer block diagram of the automobile suspension equation M X double dot plus D X dot plus K x equals K f of t. A summer labelled K f of t minus D X dot minus K x produces M X double dot, which is scaled by one over M to give X double dot; an integrator gives X dot, an inverter gives minus X dot, a second integrator gives minus x, and a second inverter gives x. Dashed feedback lines carry the damping term from X dot and the spring term from x back into the summer.">

<defs><marker id="fg3c" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="fig-head pri"/></marker><marker id="fg3d" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="fig-head acc"/></marker></defs>

<text class="fig-t sm start" x="20" y="24">Analog wiring of  MẌ + DẊ + Kx = K f(t)</text>

<rect class="fig-node pri" x="20" y="96" width="170" height="76" rx="10"/>
<text class="fig-t sm start" x="34" y="118">Σ</text>
<text class="fig-t mono" x="110" y="132">K f(t) − D Ẋ − K x</text>
<text class="fig-t sm" x="110" y="156">summer</text>

<path class="fig-edge" d="M190,134 H218" marker-end="url(#fg3c)"/>
<text class="fig-t mono sm" x="206" y="152">MẌ</text>
<rect class="fig-node" x="222" y="96" width="92" height="76" rx="10"/>
<text class="fig-t mono" x="268" y="146">× 1/M</text>

<path class="fig-edge" d="M314,134 H342" marker-end="url(#fg3c)"/>
<text class="fig-t mono sm" x="330" y="152">Ẍ</text>
<rect class="fig-node sec" x="346" y="96" width="92" height="76" rx="10"/>
<text class="fig-t" x="392" y="140">∫ dt</text>
<text class="fig-t sm" x="392" y="160">integrator</text>

<path class="fig-edge" d="M438,134 H466" marker-end="url(#fg3c)"/>
<text class="fig-t mono sm" x="454" y="152">Ẋ</text>
<rect class="fig-node" x="470" y="96" width="92" height="76" rx="10"/>
<text class="fig-t mono" x="516" y="146">× (−1)</text>

<path class="fig-edge" d="M562,134 H590" marker-end="url(#fg3c)"/>
<text class="fig-t mono sm" x="578" y="152">−Ẋ</text>
<rect class="fig-node sec" x="594" y="96" width="92" height="76" rx="10"/>
<text class="fig-t" x="640" y="140">∫ dt</text>
<text class="fig-t sm" x="640" y="160">integrator</text>

<path class="fig-edge" d="M686,134 H714" marker-end="url(#fg3c)"/>
<text class="fig-t mono sm" x="702" y="152">−x</text>
<rect class="fig-node" x="718" y="96" width="92" height="76" rx="10"/>
<text class="fig-t mono" x="764" y="146">× (−1)</text>

<path class="fig-edge" d="M810,134 H838" marker-end="url(#fg3c)"/>
<circle class="fig-dot" cx="838" cy="134" r="3.5"/>
<text class="fig-t start" x="850" y="140">x(t)</text>

<path class="fig-edge acc" d="M454,138 V52 H120 V92" marker-end="url(#fg3d)"/>
<text class="fig-t sm acc" x="287" y="44">damping D</text>
<path class="fig-edge acc" d="M838,138 V300 H120 V176" marker-end="url(#fg3d)"/>
<text class="fig-t sm acc" x="500" y="290">spring K</text>

</svg>

<figcaption>Fig 3.1 — The suspension equation wired as an analog computer. Read the solid path left to right; the two dashed lines are the feedback terms the summer needs, tapped from Ẋ and from x. Each integrator inverts, so the signal alternates between normal and negated on alternate blocks — that is the sign bookkeeping the block-diagram question is really testing.</figcaption>

</figure>

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

<figure class="figure-wrap">

<svg class="figure wide" viewBox="0 0 700 262" role="img" aria-label="Block diagram of a negative feedback control loop: the input r of t is compared with the fed-back output at a summing junction, the difference or error drives the process G of s to produce the output c of t, and a sensor H of s samples the output and returns it to the summing junction with a minus sign.">

<defs><marker id="fg3b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="fig-head pri"/></marker></defs>

<text class="fig-t sm start" x="20" y="24">Negative feedback — the output is sampled and compared with the input</text>

<text class="fig-t start" x="10" y="116">r(t)</text>
<path class="fig-edge" d="M48,110 H94" marker-end="url(#fg3b)"/>
<circle class="fig-node" cx="120" cy="110" r="22"/>
<text class="fig-t sm" x="92" y="96">+</text>
<text class="fig-t sm" x="100" y="154">−</text>
<path class="fig-edge pri" d="M142,110 H218" marker-end="url(#fg3b)"/>
<text class="fig-t sm" x="180" y="100">e(t)</text>
<rect class="fig-node pri" x="222" y="76" width="210" height="68" rx="10"/>
<text class="fig-t" x="327" y="104">Process G(s)</text>
<text class="fig-t sm" x="327" y="126">furnace / servo / plant</text>
<path class="fig-edge" d="M432,110 H514" marker-end="url(#fg3b)"/>
<circle class="fig-dot" cx="520" cy="110" r="3.5"/>
<path class="fig-edge" d="M520,110 H596" marker-end="url(#fg3b)"/>
<text class="fig-t start" x="604" y="116">c(t)</text>
<path class="fig-edge pri" d="M520,110 V212 H398" marker-end="url(#fg3b)"/>
<rect class="fig-node sec" x="222" y="188" width="170" height="48" rx="10"/>
<text class="fig-t" x="307" y="217">Sensor H(s)</text>
<path class="fig-edge pri" d="M222,212 H120 V136" marker-end="url(#fg3b)"/>
<text class="fig-t sm acc" x="168" y="202">feedback</text>

</svg>

<figcaption>Fig 3.2 — Negative feedback. The summing junction takes r(t) <strong>plus</strong> the sampled output and the loop closes with a minus sign at the inverting input, so a rise in the output reduces the error. Reverse that sign and you have positive feedback — the version that oscillates or runs away.</figcaption>

</figure>
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
  {q:"If the fighter-bomber distance falls to ≤ 10 units, what happens?", options:["Fighter escapes","Bomber escapes","Bomber is shot down","Both retreat"], answer:2, explanation:"10 units is the stated firing range — the fighter can launch its missile and the bomber is shot down. If it cannot close to 10 units within the time allowed, the bomber escapes."},
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
<figure class="figure-wrap">
<svg class="figure wide" viewBox="0 0 700 262" role="img" aria-label="Block diagram of a negative feedback control loop: the input r of t is compared with the fed-back output at a summing junction, the difference or error drives the process G of s to produce the output c of t, and a sensor H of s samples the output and returns it to the summing junction with a minus sign.">
<defs><marker id="fg3e" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="fig-head pri"/></marker></defs>
<text class="fig-t sm start" x="20" y="24">Negative feedback — the output is sampled and compared with the input</text>
<text class="fig-t start" x="10" y="116">r(t)</text>
<path class="fig-edge" d="M48,110 H94" marker-end="url(#fg3e)"/>
<circle class="fig-node" cx="120" cy="110" r="22"/>
<text class="fig-t sm" x="92" y="96">+</text>
<text class="fig-t sm" x="100" y="154">−</text>
<path class="fig-edge pri" d="M142,110 H218" marker-end="url(#fg3e)"/>
<text class="fig-t sm" x="180" y="100">e(t)</text>
<rect class="fig-node pri" x="222" y="76" width="210" height="68" rx="10"/>
<text class="fig-t" x="327" y="104">Process G(s)</text>
<text class="fig-t sm" x="327" y="126">furnace / servo / plant</text>
<path class="fig-edge" d="M432,110 H514" marker-end="url(#fg3e)"/>
<circle class="fig-dot" cx="520" cy="110" r="3.5"/>
<path class="fig-edge" d="M520,110 H596" marker-end="url(#fg3e)"/>
<text class="fig-t start" x="604" y="116">c(t)</text>
<path class="fig-edge pri" d="M520,110 V212 H398" marker-end="url(#fg3e)"/>
<rect class="fig-node sec" x="222" y="188" width="170" height="48" rx="10"/>
<text class="fig-t" x="307" y="217">Sensor H(s)</text>
<path class="fig-edge pri" d="M222,212 H120 V136" marker-end="url(#fg3e)"/>
<text class="fig-t sm acc" x="168" y="202">feedback</text>
</svg>
<figcaption>Fig 3.2 — Negative feedback. The summing junction takes r(t) <strong>plus</strong> the sampled output and the loop closes with a minus sign at the inverting input, so a rise in the output reduces the error. Reverse that sign and you have positive feedback — the version that oscillates or runs away. Draw this loop for <em>both</em> the home-heating and the autopilot example; only G(s) and H(s) change.</figcaption>
</figure>
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
<div class="formula-box">dh(t)/dt = (Q<sub>in</sub>(t) - Q<sub>out</sub>(t)) / A(h(t))</div>
<p>where h(t) = water level at time t, Q<sub>in</sub> = inlet rate, Q<sub>out</sub> = outlet rate, A(h) = cross-sectional area at height h. This ODE lets us simulate and predict water levels over time.</p>
<p><strong>Example — Suspension System:</strong> MẌ + DẊ + Kx = Kf(t) describes the displacement of a vehicle over rough terrain, allowing engineers to optimize suspension parameters.</p>`},
  {year:"2025 M", marks:"4", repeats:2, q:"Describe the pure pursuit problem in continuous systems.", occ:[{year:"2012 C", marks:"5", q:"Explain pure pursuit problem"}, {year:"2010 F", marks:"6", q:"Discuss a pure pursuit problem with a suitable example"}],
   answer:`<h4>Answer</h4>
<p>The <strong>pure pursuit problem</strong> is a classic continuous system simulation where a pursuer (e.g., fighter aircraft) constantly adjusts its direction to fly directly toward a moving target (e.g., bomber).</p>
<p><strong>Setup:</strong> Fighter at (0, 50), Bomber on x-axis. Fighter always points toward bomber's current position.</p>
<p><strong>Assumptions:</strong> Same 2D plane, constant fighter speed, known target path, minimum firing distance = 10 units.</p>
<p><strong>Formulas:</strong></p>
<ul>
<li>Distance: d = √((x<sub>b</sub> - x<sub>f</sub>)² + (y<sub>b</sub> - y<sub>f</sub>)²)</li>
<li>sin θ = (y<sub>b</sub> - y<sub>f</sub>)/d, cos θ = (x<sub>b</sub> - x<sub>f</sub>)/d</li>
<li>x<sub>f</sub>(t+1) = x<sub>f</sub>(t) + V<sub>p</sub> × cos θ &nbsp;← cos θ is the x-component</li>
<li>y<sub>f</sub>(t+1) = y<sub>f</sub>(t) + V<sub>p</sub> × sin θ &nbsp;← sin θ is the y-component</li>
</ul>
<p>If d ≤ 10 units → bomber shot down. If the fighter cannot close to 10 units within the time allowed → bomber escapes. If target path is straight → analytical solution. If curved → simulation needed.</p>`},
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
<figure class="figure-wrap">
<svg class="figure wide" viewBox="0 0 900 380" role="img" aria-label="A continuous trajectory of state h against time, with three discrete event interactions marked. The level falls continuously to the 20 percent line, where an event switches the pump on and the slope becomes positive. It rises continuously to the 85 percent line, where an event switches the pump off and the slope becomes negative. Later, a discrete event opens a valve and the state jumps vertically down to a new value, after which the trajectory rises again.">
<path class="fig-axis" d="M 70,320 V 40"/>
<path class="fig-axis" d="M 70,320 H 862"/>
<text class="fig-t sm start" x="78" y="36">state h(t)</text>
<text class="fig-t sm end" x="856" y="340">time t</text>
<path class="fig-edge acc" d="M 70,128 H 862"/>
<text class="fig-t sm acc start" x="78" y="120">85 % — pump OFF</text>
<path class="fig-edge acc" d="M 70,272 H 862"/>
<text class="fig-t sm acc start" x="78" y="264">20 % — pump ON</text>
<path class="fig-curve" d="M 70,170 L 250,272 L 520,128 L 690,208"/>
<path class="fig-edge dan" d="M 690,208 V 262"/>
<path class="fig-curve" d="M 690,262 L 850,118"/>
<circle class="fig-dot acc" cx="250" cy="272" r="5"/>
<circle class="fig-dot acc" cx="520" cy="128" r="5"/>
<circle class="fig-dot acc" cx="690" cy="208" r="5"/>
<circle class="fig-dot acc" cx="690" cy="262" r="5"/>
<text class="fig-t sm start" x="200" y="300">event: h falls through 20 % &#8594; pump ON</text>
<text class="fig-t sm start" x="430" y="106">event: h reaches 85 % &#8594; pump OFF</text>
<text class="fig-t sm end" x="680" y="240">discrete event: valve opened — the state jumps</text>
<text class="fig-t sm start" x="78" y="360">Between events the trajectory is integrated continuously; each dot is an instant at which an event changes either the value or the slope.</text>
</svg>
<figcaption>Fig 3.3 — <strong>Event interactions in a hybrid model</strong>, drawn on one trajectory. The amber dashed lines are the two thresholds, the indigo curve is the continuous integration between them, each dot is an instant at which an event fires, and the thick red vertical is the one interaction that is not continuous at all — a <em>state jump</em>, where the variable skips the values in between instead of passing through them. A slope change, a threshold crossing and a jump are the three shapes every interaction in the list above takes on a trajectory; the rest differ in <em>which</em> equation the event changes, not in how it looks.</figcaption>
</figure>

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

<p>Read it one row at a time. A row is: <em>coefficient potentiometers</em> (the ○○○ symbols) → a <em>summing inverter</em> that adds the terms and flips the algebraic sign → an <em>integrator</em>, which turns the derivative back into the state variable. Because an integrator inverts, every state variable leaves the diagram negated — that is why you see −X₁, −X₂, −X₃ at the right.</p>

<figure class="figure-wrap">

<svg class="figure wide" viewBox="0 0 712 464" role="img" aria-label="Analog-computer block diagram of the three-compartment liver model. Row one: X1 through potentiometer K12 and X2 through potentiometer K21 feed a summing inverter whose output is X1 prime, and an integrator with initial condition X1 of 0 produces minus X1. Row two: X1 through K12 and X2 through K21 plus K23 feed a summing inverter producing X2 prime, and an integrator with initial condition X2 of 0 produces minus X2. Row three: X2 through K23 feeds a summing inverter producing X3 prime, and an integrator with initial condition X3 of 0 produces minus X3.">

<defs><marker id="fg3a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="fig-head pri"/></marker></defs>

<text class="fig-t sm" x="70" y="24">potentiometer</text>
<text class="fig-t sm" x="303" y="24">summing inverter</text>
<text class="fig-t sm" x="545" y="24">integrator</text>

<rect class="fig-node" x="14" y="56" width="112" height="28" rx="6"/>
<text class="fig-t mono" x="70" y="75">X₁ × K₁₂</text>
<rect class="fig-node" x="14" y="96" width="112" height="28" rx="6"/>
<text class="fig-t mono" x="70" y="115">X₂ × K₂₁</text>
<path class="fig-edge pri" d="M126,70 H176 V82 H200" marker-end="url(#fg3a)"/>
<path class="fig-edge pri" d="M126,110 H176 V98 H200" marker-end="url(#fg3a)"/>
<rect class="fig-node pri" x="206" y="54" width="194" height="72" rx="10"/>
<text class="fig-t sm" x="220" y="100">Σ</text>
<text class="fig-t mono" x="310" y="95">−K₁₂X₁ + K₂₁X₂</text>
<path class="fig-edge" d="M400,90 H464" marker-end="url(#fg3a)"/>
<text class="fig-t sm" x="432" y="80">X₁′</text>
<rect class="fig-node sec" x="470" y="54" width="150" height="72" rx="10"/>
<text class="fig-t" x="545" y="86">∫ dt</text>
<text class="fig-t sm" x="545" y="106">IC = X₁(0)</text>
<path class="fig-edge sec" d="M620,90 H648" marker-end="url(#fg3a)"/>
<text class="fig-t start" x="656" y="95">−X₁</text>

<rect class="fig-node" x="14" y="198" width="112" height="28" rx="6"/>
<text class="fig-t mono" x="70" y="217">X₁ × K₁₂</text>
<rect class="fig-node" x="14" y="238" width="112" height="28" rx="6"/>
<text class="fig-t mono" x="70" y="257">X₂ × (K₂₁+K₂₃)</text>
<path class="fig-edge pri" d="M126,212 H176 V224 H200" marker-end="url(#fg3a)"/>
<path class="fig-edge pri" d="M126,252 H176 V240 H200" marker-end="url(#fg3a)"/>
<rect class="fig-node pri" x="206" y="196" width="194" height="72" rx="10"/>
<text class="fig-t sm" x="220" y="242">Σ</text>
<text class="fig-t mono" x="310" y="237">K₁₂X₁ − (K₂₁+K₂₃)X₂</text>
<path class="fig-edge" d="M400,232 H464" marker-end="url(#fg3a)"/>
<text class="fig-t sm" x="432" y="222">X₂′</text>
<rect class="fig-node sec" x="470" y="196" width="150" height="72" rx="10"/>
<text class="fig-t" x="545" y="228">∫ dt</text>
<text class="fig-t sm" x="545" y="248">IC = X₂(0)</text>
<path class="fig-edge sec" d="M620,232 H648" marker-end="url(#fg3a)"/>
<text class="fig-t start" x="656" y="237">−X₂</text>

<rect class="fig-node" x="14" y="360" width="112" height="28" rx="6"/>
<text class="fig-t mono" x="70" y="379">X₂ × K₂₃</text>
<path class="fig-edge pri" d="M126,374 H200" marker-end="url(#fg3a)"/>
<rect class="fig-node pri" x="206" y="338" width="194" height="72" rx="10"/>
<text class="fig-t sm" x="220" y="384">Σ</text>
<text class="fig-t mono" x="303" y="379">K₂₃X₂</text>
<path class="fig-edge" d="M400,374 H464" marker-end="url(#fg3a)"/>
<text class="fig-t sm" x="432" y="364">X₃′</text>
<rect class="fig-node sec" x="470" y="338" width="150" height="72" rx="10"/>
<text class="fig-t" x="545" y="370">∫ dt</text>
<text class="fig-t sm" x="545" y="390">IC = X₃(0)</text>
<path class="fig-edge sec" d="M620,374 H648" marker-end="url(#fg3a)"/>
<text class="fig-t start" x="656" y="379">−X₃</text>

<text class="fig-t sm start" x="14" y="444">Three states → three integrators; a shared variable is tapped into every row that needs it.</text>

</svg>

<figcaption>Fig 3.4 — Analog-computer block diagram for the 2012 compartment model. Each row produces one derivative and integrates it; the potentiometer values are the transfer coefficients K₁₂, K₂₁, K₂₃ from the given equations.</figcaption>

</figure>

<details class="fig-source">
<summary>Original ASCII sketch — kept for provenance</summary>
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
</details>

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
<figure class="figure-wrap">
<svg class="figure wide" viewBox="0 0 950 342" role="img" aria-label="Analog-computer block diagram of the equation A x double dot plus B x dot plus C x plus D equals zero. A constant block supplies minus D and a summer computes minus B x dot minus C x minus D; the sum is scaled by one over A to give x double dot; an integrator gives x dot, an inverter gives minus x dot, a second integrator gives minus x, and a second inverter gives x. Dashed feedback lines carry the damping term from x dot with gain B and the spring term from x back into the summer with gain C.">
<defs><marker id="fg3f" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="fig-head pri"/></marker><marker id="fg3g" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="fig-head acc"/></marker></defs>
<text class="fig-t sm start" x="20" y="24">Analog wiring of  A x'' + B x' + C x + D = 0</text>
<rect class="fig-node" x="20" y="112" width="76" height="44" rx="8"/>
<text class="fig-t mono" x="58" y="140">−D</text>
<text class="fig-t sm" x="58" y="176">constant</text>
<path class="fig-edge" d="M96,134 H116" marker-end="url(#fg3f)"/>
<rect class="fig-node pri" x="120" y="96" width="170" height="76" rx="10"/>
<text class="fig-t sm start" x="134" y="118">Σ</text>
<text class="fig-t mono" x="205" y="134">−Bẋ − Cx − D</text>
<text class="fig-t sm" x="205" y="158">summer</text>
<path class="fig-edge" d="M290,134 H314" marker-end="url(#fg3f)"/>
<rect class="fig-node" x="318" y="96" width="84" height="76" rx="10"/>
<text class="fig-t mono" x="360" y="142">× 1/A</text>
<path class="fig-edge" d="M402,134 H426" marker-end="url(#fg3f)"/>
<text class="fig-t mono sm" x="414" y="154">ẍ</text>
<rect class="fig-node sec" x="430" y="96" width="84" height="76" rx="10"/>
<text class="fig-t" x="472" y="140">∫ dt</text>
<text class="fig-t sm" x="472" y="160">integrator</text>
<path class="fig-edge" d="M514,134 H538" marker-end="url(#fg3f)"/>
<text class="fig-t mono sm" x="526" y="154">ẋ</text>
<rect class="fig-node" x="542" y="96" width="84" height="76" rx="10"/>
<text class="fig-t mono" x="584" y="142">× (−1)</text>
<path class="fig-edge" d="M626,134 H650" marker-end="url(#fg3f)"/>
<text class="fig-t mono sm" x="638" y="154">−ẋ</text>
<rect class="fig-node sec" x="654" y="96" width="84" height="76" rx="10"/>
<text class="fig-t" x="696" y="140">∫ dt</text>
<text class="fig-t sm" x="696" y="160">integrator</text>
<path class="fig-edge" d="M738,134 H762" marker-end="url(#fg3f)"/>
<text class="fig-t mono sm" x="750" y="154">−x</text>
<rect class="fig-node" x="766" y="96" width="84" height="76" rx="10"/>
<text class="fig-t mono" x="808" y="142">× (−1)</text>
<path class="fig-edge" d="M850,134 H886" marker-end="url(#fg3f)"/>
<circle class="fig-dot" cx="892" cy="134" r="3.5"/>
<text class="fig-t start" x="902" y="140">x(t)</text>
<path class="fig-edge acc" d="M526,138 V52 H205 V92" marker-end="url(#fg3g)"/>
<text class="fig-t sm acc" x="600" y="44">damping gain B</text>
<path class="fig-edge acc" d="M892,138 V300 H205 V176" marker-end="url(#fg3g)"/>
<text class="fig-t sm acc" x="640" y="292">spring gain C</text>
</svg>
<figcaption>Fig 3.5 — <strong>Ax'' + Bx' + Cx + D = 0</strong> wired as an analog computer. The constant term D is the only input; the two dashed taps return the damping term (gain B, taken from ẋ) and the spring term (gain C, taken from x) to the summer, and the summer is where their minus signs are applied. Read it as the ten steps above written as a picture: because the highest derivative is on the left of the equation and the lower ones are fed back, an analog machine solves it in real time with only one summer, two integrators and two inverters.</figcaption>
</figure>
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
