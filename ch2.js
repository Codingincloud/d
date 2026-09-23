window.CHAPTERS = window.CHAPTERS || {};
window.CHAPTERS[2] = {
learn: `
<h2>2.1 Monte Carlo Method</h2>
<p>The <strong>Monte Carlo method</strong> is a computational technique that uses <em>random sampling</em> to obtain numerical results for problems that might be deterministic in principle. It was developed in the <strong>1940s</strong> by <strong>John Von Neumann</strong> and other physicists working on the Manhattan Project to study neutron scattering.</p>
<div class="concept-box">
<h4>Basic Philosophy</h4>
<p>Use <strong>randomness</strong> to approximate <strong>deterministic</strong> quantities. Generate random inputs → perform computation → aggregate results to get an estimate.</p>
</div>

<h3>Steps in Monte Carlo Method</h3>
<ol>
<li><strong>Define the domain</strong> of possible inputs</li>
<li><strong>Generate random inputs</strong> from a probability distribution over the domain</li>
<li><strong>Perform a deterministic computation</strong> on the inputs</li>
<li><strong>Aggregate the results</strong> to get the final answer</li>
</ol>

<h3>Monte Carlo Integration</h3>
<p>Used to estimate definite integrals using random numbers:</p>
<div class="formula-box">I ≈ (b - a)/N × Σf(xᵢ) where xᵢ are random numbers in [a, b]</div>
<p>The actual value of the integral: I = ∫ₐᵇ f(x)dx</p>

<div class="concept-box asked">
<h4>There are two Monte Carlo integration methods — learn both</h4>
<p>They give different estimates for the same integral, so you must be able to recognise which one a question is asking for.</p>
<p><strong>1. Sample-mean (average value) method</strong> — the one used for the cubic on this page. Generate Rᵢ uniform on [0,1], map them into [a, b] with xᵢ = a + (b − a)Rᵢ, evaluate f at each xᵢ and average:</p>
<div class="formula-box">I ≈ (b − a)/N × Σ f(xᵢ)</div>
<p><strong>2. Hit-or-miss (rectangle) method</strong> — the one used in the class notes, worked on ∫₀³x²dx below. Enclose the area in a rectangle, scatter points (x, y) through it, and count how many land under the curve:</p>
<div class="formula-box">I ≈ (b − a) × (F(b) − F(a)) × n/N</div>
<p>Method 1 needs one random number per sample; method 2 needs two (one for x, one for y). Method 1 is more accurate for the same N because it uses the function value directly instead of a yes/no decision.</p>
</div>

<h3>Method 1 — Sample-Mean Integration</h3>
<div class="worked">
<div class="worked-head"><span>Estimate ∫₁⁴ (x + 4)³ dx by the sample-mean method</span><span class="meta">N = 6</span></div>

<p class="page-src">Source page: <button class="page-chip" type="button" data-page="n2p37">n2 p37</button></p>
<div class="worked-givens">
<div><span>a</span><b>1</b></div>
<div><span>b</span><b>4</b></div>
<div><span>f(x)</span><b>(x + 4)³</b></div>
<div><span>N</span><b>6</b></div>
</div>
<ol class="worked-steps">
<li><span class="worked-calc">Exact value by calculus:
∫₁⁴ (x + 4)³ dx = [ (x + 4)⁴ / 4 ]₁⁴ = (8⁴ − 5⁴)/4 = (4096 − 625)/4 = 867.75</span><span class="worked-note">Compute this first — you cannot report an error without it.</span></li>
<li><span class="worked-calc">Map each uniform Rᵢ into the interval:  xᵢ = a + (b − a)Rᵢ = 1 + 3Rᵢ</span>
<table>
<tr><th>i</th><th>Rᵢ</th><th>xᵢ = 1 + 3Rᵢ</th><th>f(xᵢ) = (xᵢ + 4)³</th></tr>
<tr><td>1</td><td>0.12</td><td>1.36</td><td>153.99</td></tr>
<tr><td>2</td><td>0.34</td><td>2.02</td><td>218.17</td></tr>
<tr><td>3</td><td>0.56</td><td>2.68</td><td>298.08</td></tr>
<tr><td>4</td><td>0.78</td><td>3.34</td><td>395.45</td></tr>
<tr><td>5</td><td>0.90</td><td>3.70</td><td>456.53</td></tr>
<tr><td>6</td><td>0.47</td><td>2.41</td><td>263.37</td></tr>
<tr><td><strong>Total</strong></td><td>—</td><td>—</td><td><strong>1785.59</strong></td></tr>
</table>
<span class="worked-note">xᵢ = 1 + 3Rᵢ spreads the six values evenly across [1, 4] — this is the only place the interval enters the calculation. Σ f(xᵢ) is the last column added down.</span></li>
<li><span class="worked-calc">I ≈ (b − a)/N × Σ f(xᵢ) = 3/6 × 1785.59 = 0.5 × 1785.59 = 892.80</span></li>
<li><span class="worked-calc">Error = |estimate − exact| = |892.80 − 867.75| = 25.05
Relative error = 25.05 / 867.75 × 100% = 2.89%</span></li>
</ol>
<div class="worked-result"><span>I ≈ 892.80</span><b>exact 867.75 · error 25.05 (2.89%)</b></div>
</div>

<h3>Method 2 — Hit-or-Miss (Rectangle) Integration</h3>

<figure class="figure-wrap">

<svg class="figure wide" viewBox="0 0 700 430" role="img" aria-label="Hit-or-miss Monte Carlo for the integral from 0 to 3 of x squared. A rectangle from x equals 0 to 3 and y equals 0 to 9 encloses the rising curve y equals x squared. Ten scattered points are plotted; the four that fall below the curve are filled and the six above it are hollow.">

<rect class="fig-fill" x="70" y="60" width="490" height="300" opacity="0.06"/>
<rect class="fig-node" x="70" y="60" width="490" height="300" fill="none"/>
<path class="fig-fill" d="M70,360 L151.7,351.7 L233.3,326.7 L315,285 L396.7,226.7 L478.3,151.7 L560,60 L560,360 Z"/>
<path class="fig-curve" d="M70,360 L151.7,351.7 L233.3,326.7 L315,285 L396.7,226.7 L478.3,151.7 L560,60"/>

<path class="fig-axis" d="M70,60 V372"/>
<path class="fig-axis" d="M58,360 H566"/>
<path class="fig-grid" d="M233.3,360 V60 M396.7,360 V60 M70,260 H560 M70,160 H560"/>
<text class="fig-t sm" x="70" y="378">0</text>
<text class="fig-t sm" x="233.3" y="378">1</text>
<text class="fig-t sm" x="396.7" y="378">2</text>
<text class="fig-t sm" x="560" y="378">3</text>
<text class="fig-t sm end" x="62" y="364">0</text>
<text class="fig-t sm end" x="62" y="264">3</text>
<text class="fig-t sm end" x="62" y="164">6</text>
<text class="fig-t sm end" x="62" y="64">9</text>

<circle class="fig-dot" cx="70" cy="360" r="4.5"/>
<circle class="fig-dot" cx="496.6" cy="136.9" r="4.5"/>
<circle class="fig-dot" cx="364.5" cy="313.4" r="4.5"/>
<circle class="fig-dot" cx="416.9" cy="287.2" r="4.5"/>
<circle class="fig-dot out" cx="362.4" cy="171.7" r="4.5"/>
<circle class="fig-dot out" cx="212.1" cy="254.7" r="4.5"/>
<circle class="fig-dot out" cx="339.5" cy="120.7" r="4.5"/>
<circle class="fig-dot out" cx="207.5" cy="219.4" r="4.5"/>
<circle class="fig-dot out" cx="467.2" cy="75.7" r="4.5"/>
<circle class="fig-dot out" cx="178.9" cy="262.6" r="4.5"/>

<text class="fig-t pri start" x="505" y="178">y = x²</text>

<text class="fig-t sm start" x="70" y="26">Rectangle = (b − a)(F(b) − F(a)) = 3 × 9 = 27</text>
<circle class="fig-dot" cx="86" cy="44" r="5"/>
<text class="fig-t sm start" x="98" y="48">inside — y − x² ≤ 0, counts as n</text>
<circle class="fig-dot out" cx="330" cy="44" r="5"/>
<text class="fig-t sm start" x="342" y="48">outside — y − x² &gt; 0, ignored</text>

<text class="fig-t sm start" x="70" y="400">The ten dots are the ten rows of the worked table below: n = 4 inside of N = 10, so</text>
<text class="fig-t sm start" x="70" y="416">I ≈ 27 × 4/10 = 10.8 against an exact 9 — an error of 20% on ten points.</text>

</svg>

<figcaption>Fig 2.1 — The hit-or-miss rectangle for ∫<sub>0</sub><sup>3</sup>x²dx. The shaded area is what n/N estimates: points land uniformly in the whole rectangle, so the fraction under the curve approximates area/rectangle — here 4/10 against a true 9/27 = 1/3. The ten dots are exactly the ten rows of the worked table, so the picture and the arithmetic can be checked against each other.</figcaption>

</figure>
<p>This is the method used in the class notes, and it is the one most exam questions expect. The area is boxed into a rectangle, points are scattered through the rectangle, and a point counts if it lands <strong>below the curve</strong>.</p>
<div class="worked">
<div class="worked-head"><span>Estimate ∫₀³ x² dx by the hit-or-miss method</span><span class="meta">Lesson example · N = 10</span></div>

<p class="page-src">Source page: <button class="page-chip" type="button" data-page="n2p37">n2 p37</button></p>
<div class="worked-givens">
<div><span>a</span><b>0</b></div>
<div><span>b</span><b>3</b></div>
<div><span>f(x)</span><b>x²</b></div>
<div><span>N</span><b>10</b></div>
</div>
<ol class="worked-steps">
<li><span class="worked-calc">y = f(x) = x²
At x = a = 0:  f(0) = 0
At x = b = 3:  f(3) = 9</span></li>
<li><span class="worked-calc">Boundaries:   0 &lt; x &lt; 3   and   0 &lt; y &lt; 9
Area of rectangle = (b − a) × (F(b) − F(a)) = (3 − 0) × (9 − 0) = 27</span></li>
<li><span class="worked-calc">Decision rule for one point (x, y):
if  y − F(x) ≤ 0   the point is INSIDE (under the curve)
otherwise          the point is OUTSIDE</span></li>
<li><span class="worked-calc">Scatter the points and test each one:</span>
<table>
<tr><th>S.N.</th><th>x</th><th>y</th><th>y − x²</th><th>Remark</th></tr>
<tr><td>1</td><td>0</td><td>0</td><td>0.000</td><td>In</td></tr>
<tr><td>2</td><td>1.79</td><td>5.65</td><td>2.446</td><td>Out</td></tr>
<tr><td>3</td><td>0.87</td><td>3.16</td><td>2.403</td><td>Out</td></tr>
<tr><td>4</td><td>1.65</td><td>7.18</td><td>4.457</td><td>Out</td></tr>
<tr><td>5</td><td>0.842</td><td>4.219</td><td>3.510</td><td>Out</td></tr>
<tr><td>6</td><td>2.612</td><td>6.693</td><td>−0.130</td><td>In</td></tr>
<tr><td>7</td><td>1.803</td><td>1.399</td><td>−1.852</td><td>In</td></tr>
<tr><td>8</td><td>2.432</td><td>8.53</td><td>2.615</td><td>Out</td></tr>
<tr><td>9</td><td>2.124</td><td>2.184</td><td>−2.327</td><td>In</td></tr>
<tr><td>10</td><td>0.667</td><td>2.921</td><td>2.476</td><td>Out</td></tr>
<tr><td><strong>Total</strong></td><td colspan="3">points inside (y − x² ≤ 0)</td><td><strong>4 / 10</strong></td></tr>
</table>
<span class="worked-note">x must be drawn in [0, 3] and y in [0, 9] — not both in [0, 1]. A point exactly on the curve counts as inside, which is why (0, 0) with y − x² = 0 is an "In".</span></li>
<li><span class="worked-calc">I ≈ Area of rectangle × n/N = 27 × 4/10 = 10.8</span></li>
<li><span class="worked-calc">Exact value:  ∫₀³ x² dx = [x³/3]₀³ = 27/3 = 9
Error = |10.8 − 9| = 1.8       Relative error = 1.8/9 × 100% = 20%</span></li>
</ol>
<div class="worked-result"><span>I ≈ 10.8</span><b>exact 9 · error 1.8 (20%)</b></div>
</div>
<div class="concept-box warn">
<h4>The count n is where the marks are lost</h4>
<p>Everything else in this method is mechanical, so <strong>tabulate the n/N count carefully</strong> — one point classified the wrong way changes the answer by 2.7 (= 27/10) here. Check that the In and Out counts add up to N before you compute the integral.</p>
</div>

<h3>Error and Convergence of Monte Carlo Estimates</h3>
<p>The Monte Carlo estimate is a random variable, so it carries a <strong>standard error</strong> rather than a fixed error:</p>
<div class="formula-box">SE = (b − a) × s / √N &nbsp;&nbsp;&nbsp; where s² = (1/(N−1)) × Σ (f(xᵢ) − f̄)²</div>
<p>Two consequences are worth remembering:</p>
<ul>
<li><strong>Error falls only as 1/√N</strong> — to halve the error you must take four times as many samples, and to get one extra decimal digit you need 100 times as many.</li>
<li>The estimate is <strong>unbiased</strong>: E[I<sub>estimate</sub>] = I, so repeating the whole experiment many times and averaging the results converges to the true value (Law of Large Numbers).</li>
<li>A <strong>confidence interval</strong> can be quoted, e.g. I ≈ estimate ± 1.96 × SE at 95% confidence.</li>
</ul>
<div class="concept-box tip">
<h4>Variance Reduction</h4>
<p>Because plain Monte Carlo converges slowly, variance-reduction techniques are used to get a better answer from the same number of samples: <strong>antithetic variates</strong> (pair every R with 1 − R), <strong>stratified / importance sampling</strong> (sample more densely where the function contributes most), and <strong>control variates</strong> (use a correlated quantity whose exact value is known).</p>
</div>

<h3>Estimating π using Monte Carlo</h3>
<p>One of the classic applications of Monte Carlo method:</p>
<ol>
<li>Consider a circle x² + y² = r² inscribed in a square of side 2r</li>
<li>Area of circle = πr², Area of square = (2r)² = 4r²</li>
<li>Ratio = πr²/4r² = π/4</li>
<li>Generate random points (x, y) uniformly in the square</li>
<li>Count how many fall inside the circle (x² + y² ≤ r²)</li>
</ol>
<div class="formula-box">π ≈ 4 × (Points inside circle) / (Total points)</div>

<div class="concept-box asked">
<h4>Two sampling conventions — both give π ≈ 4n/N</h4>
<p><strong>First quadrant only</strong> (what the class notes use, written "X = Rand#(4), Y = Rand#(4)"): points are drawn in [0, r]², so the quarter-circle sits in a square of side r. The ratio is (πr²/4) / r² = π/4.</p>
<p><strong>Full circle</strong> (used in the worked numerical below): points are drawn in [−r, r]², so the circle sits in a square of side 2r. The ratio is πr² / (2r)² = π/4.</p>
<p>Both ratios are π/4, so both give <strong>π ≈ 4 × (points inside) / (total points)</strong>. Pick one convention, say which you used, and map your random numbers to the right range — drawing x in [0, 4] and y in [−4, 4] mixes the two and will be marked wrong.</p>
</div>

<div class="worked">
<div class="worked-head"><span>Estimate π from x² + y² = 16, full circle</span><span class="meta">r = 4 · N = 10</span></div>
<div class="worked-givens">
<div><span>Radius r</span><b>4</b></div>
<div><span>Square</span><b>[−4, 4]², area 64</b></div>
<div><span>Circle</span><b>x² + y² ≤ 16, area 16π</b></div>
<div><span>N</span><b>10</b></div>
</div>
<ol class="worked-steps">
<li><span class="worked-calc">πr² / (2r)² = 16π / 64 = π/4
π ≈ 4 × (points inside circle) / (total points)</span></li>
<li><span class="worked-calc">Map each pair of random numbers into the square:
x = −4 + 8R₁        y = −4 + 8R₂</span>
<table>
<tr><th>P</th><th>R₁</th><th>R₂</th><th>x</th><th>y</th><th>x² + y²</th><th>≤ 16 ?</th></tr>
<tr><td>1</td><td>0.15</td><td>0.72</td><td>−2.80</td><td>1.76</td><td>10.94</td><td>Yes</td></tr>
<tr><td>2</td><td>0.63</td><td>0.31</td><td>1.04</td><td>−1.52</td><td>3.39</td><td>Yes</td></tr>
<tr><td>3</td><td>0.88</td><td>0.95</td><td>3.04</td><td>3.60</td><td>22.20</td><td>No</td></tr>
<tr><td>4</td><td>0.42</td><td>0.07</td><td>−0.64</td><td>−3.44</td><td>12.24</td><td>Yes</td></tr>
<tr><td>5</td><td>0.77</td><td>0.55</td><td>2.16</td><td>0.40</td><td>4.83</td><td>Yes</td></tr>
<tr><td>6</td><td>0.24</td><td>0.83</td><td>−2.08</td><td>2.64</td><td>11.30</td><td>Yes</td></tr>
<tr><td>7</td><td>0.95</td><td>0.36</td><td>3.60</td><td>−1.12</td><td>14.21</td><td>Yes</td></tr>
<tr><td>8</td><td>0.51</td><td>0.66</td><td>0.08</td><td>1.28</td><td>1.64</td><td>Yes</td></tr>
<tr><td>9</td><td>0.09</td><td>0.19</td><td>−3.28</td><td>−2.48</td><td>16.91</td><td>No</td></tr>
<tr><td>10</td><td>0.70</td><td>0.44</td><td>1.60</td><td>−0.48</td><td>2.79</td><td>Yes</td></tr>
<tr><td><strong>Total</strong></td><td colspan="5">points inside the circle</td><td><strong>8 / 10</strong></td></tr>
</table>
<span class="worked-note">x² + y² = 14.21 &lt; 16 is inside; x² + y² = 16.91 &gt; 16 is outside — the comparison is against r² = 16, not against r = 4.</span></li>
<li><span class="worked-calc">π ≈ 4 × 8/10 = 3.2</span></li>
<li><span class="worked-calc">Error = |3.2 − 3.14159| = 0.0584
Relative error = 0.0584 / 3.14159 × 100% = 1.86%</span><span class="worked-note">Only 10 points are used so the arithmetic stays hand-workable. Because error falls as 1/√N, 10 000 points typically give π to two or three decimal places.</span></li>
</ol>
<div class="worked-result"><span>π ≈ 3.2</span><b>error 0.0584 (1.86%)</b></div>
</div>

<div class="worked">
<div class="worked-head"><span>Estimate π from x² + y² = 36 — the class numerical</span><span class="meta">r = 6 · N = 15</span></div>

<p class="page-src">Source page: <button class="page-chip" type="button" data-page="n2p37">n2 p37</button></p>
<div class="worked-givens">
<div><span>Radius r</span><b>6</b></div>
<div><span>Square</span><b>x, y in [0, 6], area 36</b></div>
<div><span>Quarter circle</span><b>area 9π</b></div>
<div><span>N</span><b>15</b></div>
</div>
<ol class="worked-steps">
<li><span class="worked-calc">Quarter circle in a square of side r:
(πr²/4) / r² = π/4   →   π ≈ 4n/N</span><span class="worked-note">Written in the notes as X = Rand#(6), Y = Rand#(6) — both coordinates in [0, 6]. With r = 6 the point is inside when x² + y² − 36 ≤ 0.</span></li>
<li><span class="worked-calc">Test each scattered point against the quarter circle:</span>
<table>
<tr><th>S.N.</th><th>x</th><th>y</th><th>x² + y² − 36</th><th>Remark</th></tr>
<tr><td>1</td><td>0</td><td>0</td><td>−36.000</td><td>In</td></tr>
<tr><td>2</td><td>4.342</td><td>2.165</td><td>−12.460</td><td>In</td></tr>
<tr><td>3</td><td>5.601</td><td>3.005</td><td>4.401</td><td>Out</td></tr>
<tr><td>4</td><td>1.668</td><td>0.967</td><td>−32.283</td><td>In</td></tr>
<tr><td>5</td><td>4.644</td><td>3.047</td><td>−5.149</td><td>In</td></tr>
<tr><td>6</td><td>3.005</td><td>4.974</td><td>−2.229</td><td>In</td></tr>
<tr><td>7</td><td>5.098</td><td>4.234</td><td>7.916</td><td>Out</td></tr>
<tr><td>8</td><td>1.664</td><td>4.339</td><td>−14.404</td><td>In</td></tr>
<tr><td>9</td><td>4.032</td><td>0.474</td><td>−19.518</td><td>In</td></tr>
<tr><td>10</td><td>3.317</td><td>5.963</td><td>10.560</td><td>Out</td></tr>
<tr><td>11</td><td>3.606</td><td>1.468</td><td>−20.842</td><td>In</td></tr>
<tr><td>12</td><td>3.937</td><td>2.874</td><td>−12.240</td><td>In</td></tr>
<tr><td>13</td><td>0.301</td><td>5.855</td><td>−1.628</td><td>In</td></tr>
<tr><td>14</td><td>3.418</td><td>5.646</td><td>7.560</td><td>Out</td></tr>
<tr><td>15</td><td>0.689</td><td>0.915</td><td>−34.688</td><td>In</td></tr>
<tr><td><strong>Total</strong></td><td colspan="2">11 In + 4 Out</td><td>—</td><td><strong>11 / 15</strong></td></tr>
</table>
<span class="worked-note">Points 1–15 are all in the first quadrant, so all the x and y values are positive. A point is inside when x² + y² − 36 ≤ 0, i.e. when x² + y² ≤ 36.</span></li>
<li><span class="worked-calc">n = 11 points inside,  N = 15
Check: 11 In + 4 Out = 15 = N ✓</span></li>
<li><span class="worked-calc">π ≈ 4 × n/N = 4 × 11/15 = 44/15 = 2.933</span></li>
<li><span class="worked-calc">Taking the true value as π = 3.14:
Error E = |π<sub>actual</sub> − π<sub>calculated</sub>| = |3.14 − 2.9333| = 0.2067
E% = E/π<sub>actual</sub> × 100% = 0.2067/3.14 × 100% = 6.58%</span></li>
</ol>
<div class="worked-result"><span>π ≈ 2.933</span><b>error 0.2067 (6.58%)</b></div>
</div>
<div class="concept-box important">
<h4>Compare the two estimates honestly</h4>
<p>Ten points gave π ≈ 3.2 (1.86% error) and fifteen points gave π ≈ 2.933 (6.58% error). More points did <em>not</em> give a better answer here — Monte Carlo error is <strong>random</strong>, not monotonic. What the 1/√N rule promises is that the error <em>tends</em> to shrink, and that to be confident of halving it you need four times as many points. Never claim a Monte Carlo estimate is better just because N is larger.</p>
</div>

<h3>Monte Carlo for Business Simulation</h3>
<p>Monte Carlo can simulate real business scenarios like inventory management, demand forecasting, and queuing problems by assigning random number ranges to probability distributions.</p>

<div class="concept-box">
<h4>Vegetable Shopkeeper — the method</h4>
<p>Given probability distributions for customers/day and kg/customer:</p>
<ol>
<li>Assign random number ranges to each probability (cumulative probability × 100)</li>
<li>Generate random numbers for each day</li>
<li>Map random numbers to number of customers</li>
<li>For each customer, generate another random number for kg ordered</li>
<li>Calculate total demand per day</li>
</ol>
<p>The ranges must tile 00–99 with no gap and no overlap, and the last cumulative probability must reach exactly 1.00 — otherwise some random numbers map to nothing.</p>
</div>

<div class="worked">
<div class="worked-head"><span>Green-vegetable ordering for a 2-day simulation</span><span class="meta">Demand &amp; inventory</span></div>
<div class="worked-givens">
<div><span>Customers/day</span><b>8, 10, 12, 14</b></div>
<div><span>p</span><b>0.35, 0.30, 0.25, 0.10</b></div>
<div><span>Kg/customer</span><b>1, 2, 3, 4</b></div>
<div><span>p</span><b>0.2, 0.4, 0.3, 0.1</b></div>
</div>
<ol class="worked-steps">
<li>Build the random-number ranges from the cumulative probabilities.
<table>
<tr><th>Customers/day</th><th>Probability</th><th>Cumulative</th><th>RN range</th></tr>
<tr><td>8</td><td>0.35</td><td>0.35</td><td>00–34</td></tr>
<tr><td>10</td><td>0.30</td><td>0.65</td><td>35–64</td></tr>
<tr><td>12</td><td>0.25</td><td>0.90</td><td>65–89</td></tr>
<tr><td>14</td><td>0.10</td><td>1.00</td><td>90–99</td></tr>
</table>
<table>
<tr><th>Kg ordered</th><th>Probability</th><th>Cumulative</th><th>RN range</th></tr>
<tr><td>1</td><td>0.2</td><td>0.2</td><td>00–19</td></tr>
<tr><td>2</td><td>0.4</td><td>0.6</td><td>20–59</td></tr>
<tr><td>3</td><td>0.3</td><td>0.9</td><td>60–89</td></tr>
<tr><td>4</td><td>0.1</td><td>1.0</td><td>90–99</td></tr>
</table>
</li>
<li>Simulate. One random number per day sets the customer count; then <strong>one random number per individual customer</strong> sets the quantity ordered.
<table>
<tr><th>Day</th><th>RN for customers</th><th>Customers</th><th>Individual RNs for kg</th><th>Kg per customer</th><th>Total demand</th></tr>
<tr><td>1</td><td>24</td><td>8</td><td>15, 47, 82, 66, 29, 91, 55, 38</td><td>1, 2, 3, 3, 2, 4, 2, 2</td><td><strong>19 kg</strong></td></tr>
<tr><td>2</td><td>71</td><td>12</td><td>22, 08, 63, 74, 45, 96, 31, 58, 88, 12, 40, 67</td><td>2, 1, 3, 3, 2, 4, 2, 2, 3, 1, 2, 3</td><td><strong>28 kg</strong></td></tr>
</table><span class="worked-note">Day 1 cost 8 individual random numbers because 8 customers were drawn; day 2 cost 12. The number of samples per day is not fixed — it follows from the day's customer count.</span></li>
<li>Average demand = (19 + 28)/2 = 23.5 kg per day</li>
</ol>
<div class="worked-result"><span>Average demand 23.5 kg/day</span><b>buy about 24 kg each morning</b></div>
</div>
<p><strong>Note on method:</strong> taking the expected value (E[kg] = 1×0.2 + 2×0.4 + 3×0.3 + 4×0.1 = 2.3 kg) and multiplying by the number of customers gives the same average but hides the day-to-day variation. A proper simulation draws an individual random number for every customer, which is what makes it possible to report the spread of demand (and therefore the risk of running out) rather than only the mean.</p>
<p>Two days is also too short to draw a conclusion — with only two demands (19 and 28) the average could move a long way in either direction. State the number of replications a real study would need, and why.</p>

<h2>2.2 Normally Distributed Random Numbers</h2>
<p>Many natural phenomena follow a <strong>normal (Gaussian) distribution</strong>. To generate normally distributed random numbers from uniform random numbers:</p>

<h3>Box-Muller Transform</h3>
<p>Given two independent uniform random numbers R₁ and R₂ on (0,1):</p>
<div class="formula-box">Z₁ = √(-2 ln R₁) × cos(2πR₂)<br>Z₂ = √(-2 ln R₁) × sin(2πR₂)</div>
<p>Z₁ and Z₂ are independent standard normal random variables (mean=0, variance=1).</p>
<p>To get normal with mean μ and standard deviation σ: <strong>X = μ + σZ</strong></p>

<h3>Central Limit Theorem Method</h3>
<p>Sum of 12 uniform random numbers approximates normal distribution:</p>
<div class="formula-box">Z = (Σᵢ₌₁¹² Rᵢ) - 6</div>
<p>where Rᵢ are uniform random numbers on (0,1). This gives approximately N(0,1).</p>

<h3>Why Summing 12 Uniform Numbers Works</h3>
<p>Each uniform number Rᵢ on (0,1) has mean 1/2 and variance 1/12. For 12 independent values the sum therefore has</p>
<div class="formula-box">mean = 12 × 1/2 = 6 &nbsp;&nbsp;&nbsp; variance = 12 × 1/12 = 1 &nbsp;&nbsp;&nbsp; so Z = Σ Rᵢ − 6 has mean 0 and variance 1</div>
<p>By the Central Limit Theorem the sum of many independent values is approximately normal, and 12 is the smallest count that makes the approximation both simple (an exact variance of 1) and acceptable in practice.</p>
<div class="worked">
<div class="worked-head"><span>Box-Muller — two normal values from two uniforms</span><span class="meta">Box-Muller</span></div>
<div class="worked-givens">
<div><span>R₁</span><b>0.35</b></div>
<div><span>R₂</span><b>0.60</b></div>
<div><span>Target μ, σ</span><b>100, 15</b></div>
</div>
<ol class="worked-steps">
<li><span class="worked-calc">Radius term:  √(−2 ln R₁) = √(−2 ln 0.35)
ln 0.35 = −1.0498
−2 × (−1.0498) = 2.0996
√2.0996 = 1.4490</span><span class="worked-note">ln of a number below 1 is negative, so −2 ln R₁ is positive. If your radius term comes out negative or complex, R₁ is not in (0, 1).</span></li>
<li><span class="worked-calc">Angle:  2πR₂ = 2π × 0.60 = 3.7699 rad
cos(3.7699) = −0.8088      sin(3.7699) = −0.5881</span><span class="worked-note">Work in radians, not degrees. 3.7699 rad is just past π (3.1416), so both cos and sin are negative — the point is in the third quadrant.</span></li>
<li><span class="worked-calc">Z₁ = 1.4490 × cos(3.7699) = 1.4490 × (−0.8088) = −1.172
Z₂ = 1.4490 × sin(3.7699) = 1.4490 × (−0.5881) = −0.852</span><span class="worked-note">Z₁ and Z₂ are independent standard normal values (mean 0, variance 1).</span></li>
<li><span class="worked-calc">To a general normal N(μ, σ²):  X = μ + σZ
X₁ = 100 + 15 × (−1.172) = 100 − 17.58 = 82.42
X₂ = 100 + 15 × (−0.852) = 100 − 12.78 = 87.22</span></li>
</ol>
<div class="worked-result"><span>Z₁, Z₂</span><b>−1.172, −0.852</b><span>→ N(100, 15²)</span><b>82.42, 87.22</b></div>
</div>
<h3>Comparison of the Two Methods</h3>
<table class="comparison-table">
<tr><th>Aspect</th><th>Box-Muller</th><th>Central Limit (sum of 12)</th></tr>
<tr><td><strong>Accuracy</strong></td><td>Exact normal distribution</td><td>Approximate — the tails are cut off</td></tr>
<tr><td><strong>Speed</strong></td><td>Slower — needs logarithm, sine and cosine</td><td>Very fast — additions only</td></tr>
<tr><td><strong>Random numbers used</strong></td><td>2 uniforms produce 2 normal values</td><td>12 uniforms produce 1 normal value</td></tr>
<tr><td><strong>Range</strong></td><td>Unbounded, correct extreme tails</td><td>Bounded to roughly [−6, +6]</td></tr>
<tr><td><strong>Use when</strong></td><td>Tail behaviour matters (risk analysis, rare events)</td><td>Speed matters and the tails are unimportant</td></tr>
</table>
<h3>Polar (Marsaglia) Method</h3>
<p>A variant of Box-Muller that avoids the sine and cosine: generate u and v uniformly in (−1, 1) and keep the pair only while s = u² + v² &lt; 1, then</p>
<div class="formula-box">Z₁ = u × √(−2 ln s / s) &nbsp;&nbsp;&nbsp; Z₂ = v × √(−2 ln s / s)</div>
<p>It discards some pairs (about 21% of them) but each accepted pair costs far less computation than a trigonometric Box-Muller pair.</p>

<h2>2.3 Monte Carlo Method vs Stochastic Simulation</h2>
<table class="comparison-table">
<tr><th>Feature</th><th>Monte Carlo Method</th><th>Stochastic Simulation</th></tr>
<tr><td><strong>Nature</strong></td><td>Uses random numbers to solve <em>deterministic</em> problems</td><td>Models systems with <em>inherent randomness</em></td></tr>
<tr><td><strong>Purpose</strong></td><td>Numerical estimation of mathematical quantities</td><td>Study system behavior over time</td></tr>
<tr><td><strong>Time element</strong></td><td>Typically no time component</td><td>Evolves over simulated time</td></tr>
<tr><td><strong>Examples</strong></td><td>Computing π, evaluating integrals</td><td>Bank queuing, manufacturing process</td></tr>
<tr><td><strong>Randomness role</strong></td><td>Tool for computation</td><td>Inherent part of the system</td></tr>
<tr><td><strong>System model</strong></td><td>No system model needed</td><td>Requires detailed system model</td></tr>
<tr><td><strong>Output</strong></td><td>Single numerical estimate</td><td>Time-series of system states</td></tr>
</table>
<div class="concept-box tip">
<h4>Key Distinction</h4>
<p>Monte Carlo uses randomness as a <strong>computational tool</strong> to solve deterministic problems. Stochastic simulation models systems that are <strong>inherently random</strong>.</p>
</div>

<div class="example-box">
<h4>Worked example — is the coin-toss game worth playing?</h4>
<p><em>This is the notes' own example of a random process unfolding over time (note 2, p45):</em></p>
<p>“An unbiased coin is repeatedly flipped. For each flip you have to pay Rs.1 and when the difference between the head &amp; tail becomes three, you get Rs.8. If the required difference is achieved in less than 8 flips you win some money and if it is more than 8 flips you lose. Illustrate the simulation to decide whether to play this game or not.”</p>

<p><strong>Step 1 — what one game is.</strong> A game ends the moment the running difference reaches 3 — i.e. the moment either heads or tails is leading by three. Nothing else stops it.</p>

<p><strong>Step 2 — map the random numbers.</strong> One digit per flip is enough: <strong>even → Head</strong>, <strong>odd → Tail</strong>. Track the difference (H − T) after each flip, and count the flips, because the flips are what you pay for.</p>

<p><strong>Step 3 — the payoff.</strong></p>
<div class="formula-box">net = Rs.8 − (Rs.1 × number of flips) &nbsp;→&nbsp; break-even is exactly 8 flips</div>

<p><strong>Step 4 — a hand-run of eight games</strong> from one continuous digit stream (even → H, odd → T):</p>
<table>
<tr><th>Game</th><th>Digits used</th><th>H</th><th>T</th><th>Flips</th><th>Net (Rs.)</th><th>Result</th></tr>
<tr><td>1</td><td>3 8 1 4 7 2 9 5 0 6 3 3 8 1 5</td><td>6</td><td>9</td><td>15</td><td>−7</td><td>lose</td></tr>
<tr><td>2</td><td>9 2 7 4 0 6 1 8 9 3 5 7 2 4 0 6 8</td><td>10</td><td>7</td><td>17</td><td>−9</td><td>lose</td></tr>
<tr><td>3</td><td>1 9 3</td><td>0</td><td>3</td><td>3</td><td>+5</td><td>win</td></tr>
<tr><td>4</td><td>5 2 7 4 8 0 6</td><td>5</td><td>2</td><td>7</td><td>+1</td><td>win</td></tr>
<tr><td>5</td><td>9 1 3</td><td>0</td><td>3</td><td>3</td><td>+5</td><td>win</td></tr>
<tr><td>6</td><td>5 7 2 8 4 6 0</td><td>5</td><td>2</td><td>7</td><td>+1</td><td>win</td></tr>
<tr><td>7</td><td>1 9 3</td><td>0</td><td>3</td><td>3</td><td>+5</td><td>win</td></tr>
<tr><td>8</td><td>7 5 2 4 8 6 1 0 9 3 5 7 2 4 8 6 0</td><td>10</td><td>7</td><td>17</td><td>−9</td><td>lose</td></tr>
<tr><td colspan="2"><strong>Totals</strong></td><td><strong>36</strong></td><td><strong>36</strong></td><td><strong>72</strong></td><td><strong>−8</strong></td><td><strong>5 win, 3 lose</strong></td></tr>
</table>
<p>Read the totals: 5 games won, 3 lost, yet the eight games lost Rs.8 in total — an average of <strong>−Rs.1 per game</strong>, at an average of <strong>9 flips per game</strong>.</p>

<div class="concept-box warn">
<h4>Winning more often is not the same as winning money</h4>
<p>This run wins five games out of eight and still loses money: the wins pay +5, +1, +5, +1, +5, while the losses cost −7, −9 and −9. A game that pays a fixed Rs.8 is worth playing only if the <strong>mean</strong> number of flips is below 8, and “more wins than losses” says nothing about the mean.</p>
</div>

<p><strong>Step 5 — the expectation, which is the real answer.</strong> The difference H − T performs a <strong>symmetric random walk</strong>: it starts at 0 and moves ±1 on every flip, and the game stops when it first reaches ±3. The expected time for that walk to leave the interval (−3, +3) is</p>
<div class="formula-box">E[flips] = 3 × 3 = 9 &nbsp;→&nbsp; E[net] = 8 − 9 = −Rs.1 per game</div>
<p>The expectation is negative, so <strong>do not play the game</strong>. Simulating 200 000 games gives E[flips] ≈ 9.02 and E[net] ≈ −1.02, which agrees with the theory — and this is the direction the comparison should be used in: theory first, simulation as the check.</p>

<p><strong>Step 6 — the honest caveat.</strong> Eight games is far too small a sample to establish a mean; the hand-run above reached the right average only by luck. Say that the simulation <em>illustrates</em> the method, and let the decision follow from the expectation — or from thousands of replications reported as a mean with a confidence interval (Chapter 7).</p>
</div>
`,

quiz: [
  {q:"Monte Carlo method was developed during which project?", options:["Apollo Project","Manhattan Project","Gemini Project","ENIAC Project"], answer:1, explanation:"Monte Carlo method was developed in the 1940s by John Von Neumann and others working on the Manhattan Project to study neutron scattering."},
  {q:"What does the Monte Carlo method use to solve problems?", options:["Exact analytical formulas","Random sampling","Genetic algorithms","Neural networks"], answer:1, explanation:"Monte Carlo uses random sampling to obtain numerical results for problems that might be deterministic in principle."},
  {q:"The formula for Monte Carlo integration is:", options:["I = Σf(xᵢ)","I ≈ (b-a)/N × Σf(xᵢ)","I = (a+b)/2 × f(x)","I = N × f(x₀)"], answer:1, explanation:"Monte Carlo integration estimates I = ∫f(x)dx using the formula I ≈ (b-a)/N × Σf(xᵢ) where xᵢ are random numbers in [a,b]."},
  {q:"To estimate π using Monte Carlo, we use the ratio:", options:["π = 2 × (inside/total)","π = 4 × (inside/total)","π = (inside/total)","π = 6 × (inside/total)"], answer:1, explanation:"π ≈ 4 × (points inside circle)/(total points), because the ratio of circle area to square area is π/4."},
  {q:"The Box-Muller transform converts:", options:["Normal to uniform","Uniform to normal","Exponential to normal","Normal to exponential"], answer:1, explanation:"Box-Muller transform converts two independent uniform random numbers into two independent standard normal random numbers."},
  {q:"In Box-Muller: Z₁ = √(-2 ln R₁) × cos(2πR₂), what distribution does Z₁ follow?", options:["Uniform(0,1)","Exponential(1)","Standard Normal N(0,1)","Poisson(1)"], answer:2, explanation:"Z₁ follows a standard normal distribution with mean 0 and variance 1."},
  {q:"Monte Carlo method primarily solves:", options:["Problems with inherent randomness","Deterministic problems using randomness","Only queuing problems","Only integration problems"], answer:1, explanation:"Monte Carlo uses random numbers as a computational tool to solve deterministic problems like computing integrals."},
  {q:"The Central Limit Theorem method for generating normal numbers uses how many uniform numbers?", options:["6","10","12","24"], answer:2, explanation:"Sum of 12 uniform random numbers minus 6 approximates a standard normal distribution: Z = (ΣR<sub>i</sub>) - 6."},
  {q:"Which is NOT a step in Monte Carlo method?", options:["Define domain of inputs","Generate random inputs","Build a time-dependent system model","Aggregate results"], answer:2, explanation:"Building a time-dependent system model is part of stochastic simulation, not Monte Carlo. Monte Carlo doesn't typically have a time component."},
  {q:"Monte Carlo error decreases as:", options:["Number of random samples increases","Step size increases","Time increases","System complexity increases"], answer:0, explanation:"Monte Carlo error decreases as the number of random samples (N) increases. The error rate is proportional to 1/√N."}
],

past: [
  {year:"2014 F", marks:"5", repeats:5, q:"Find the value of π by using Monte Carlo simulation using x² + y² = 16. Calculate error.", occ:[{year:"2014 F", marks:"5", q:"by using Monte Carlo simulation using the equation x\"2+y\"2= 16? Also Calculate error when compared with its analytical. value"}, {year:"2011 F", marks:"", q:"Calculate the following using Monte carol simulation. 5 4 · I= f(x A 4)/3dx 1 Also Calculate error when compared with its analytical value"}, {year:"2010 F", marks:"5", q:"by using Monte Carlo simulation using the equation x2+y2=16. Also Calculate error when compared with its analytical value"}, {year:"2014 F, 2010 F", marks:"5", q:"Find the value of pi (π) by using Monte Carlo simulation using the equation x²+y²=16. Also calculate error when compared with its analytical value"}, {year:"2011 C", marks:"5", q:"Estimate the value of π using Monte Carlo Method"}],
   answer:`<h4>Answer</h4>
<p>Given circle: x² + y² = 16 (radius r = 4)</p>
<p>Enclosing square: [-4, 4] × [-4, 4], side = 8</p>
<p><strong>Area of circle</strong> = πr² = 16π</p>
<p><strong>Area of square</strong> = 8² = 64</p>
<p><strong>Ratio</strong> = 16π/64 = π/4</p>
<p>Therefore: <strong>π = 4 × (Points inside circle) / (Total points)</strong></p>

<p><strong>Simulation:</strong> Generate random points (x, y) where -4 ≤ x ≤ 4, -4 ≤ y ≤ 4</p>
<p>Suppose we generate 10 random points:</p>
<table>
<tr><th>Point</th><th>x</th><th>y</th><th>x²+y²</th><th>Inside? (≤16)</th></tr>
<tr><td>1</td><td>1.2</td><td>3.5</td><td>13.69</td><td>Yes</td></tr>
<tr><td>2</td><td>-3.8</td><td>2.1</td><td>18.85</td><td>No</td></tr>
<tr><td>3</td><td>2.0</td><td>-1.5</td><td>6.25</td><td>Yes</td></tr>
<tr><td>4</td><td>-0.5</td><td>3.9</td><td>15.46</td><td>Yes</td></tr>
<tr><td>5</td><td>3.6</td><td>-1.8</td><td>16.20</td><td>No</td></tr>
<tr><td>6</td><td>-2.3</td><td>-2.7</td><td>12.58</td><td>Yes</td></tr>
<tr><td>7</td><td>0.8</td><td>1.2</td><td>2.08</td><td>Yes</td></tr>
<tr><td>8</td><td>-3.5</td><td>3.0</td><td>21.25</td><td>No</td></tr>
<tr><td>9</td><td>1.5</td><td>-3.0</td><td>11.25</td><td>Yes</td></tr>
<tr><td>10</td><td>-1.0</td><td>2.5</td><td>7.25</td><td>Yes</td></tr>
</table>
<p>Points inside = 7, Total = 10</p>
<p><strong>π ≈ 4 × 7/10 = 2.8</strong></p>
<p><strong>Error = |2.8 - 3.14159| = 0.34159</strong></p>
<p><em>Note: With more points (N→∞), the estimate converges to actual π.</em></p>`},
  {year:"2019 F", marks:"5", repeats:4, q:"Discuss the basic philosophy of Monte-Carlo simulation.", occ:[{year:"2019 F", marks:"5", q:"Discuss the basic philosophy of Monte:--Carlo simulation"}, {year:"2025 M", marks:"2", q:"What is the purpose of the Monte Carlo method?"}, {year:"2011 C", marks:"5+5", q:"Explain the significance of Monte Carlo Method in simulation. Estimate the value of 1t(pi) using Monte Carlo Method"}, {year:"2011 C", marks:"5", q:"Explain the significance of Monte Carlo Method in simulation"}],
   variants:[{year:"2025 M", marks:"2", q:"What is the purpose of the Monte Carlo method?", answer:`<h4>Answer</h4>
<p>The purpose of the Monte Carlo method is to use <strong>random sampling</strong> to obtain numerical solutions to problems that may be too complex for analytical solutions. It converts deterministic problems into probabilistic ones by using random numbers.</p>
<p><strong>Key purposes:</strong></p>
<ul>
<li>Estimate definite integrals numerically</li>
<li>Compute mathematical constants (like π)</li>
<li>Solve complex optimization problems</li>
<li>Perform risk analysis and uncertainty quantification</li>
</ul>`}],
   answer:`<h4>Answer</h4>
<p>The basic philosophy of Monte Carlo simulation is to use <strong>randomness as a computational tool</strong> to solve deterministic problems. Developed in the 1940s by John Von Neumann during the Manhattan Project.</p>
<p><strong>Philosophy:</strong> Instead of solving a problem analytically (which may be impossible for complex problems), we:</p>
<ol>
<li><strong>Define the domain</strong> of possible inputs</li>
<li><strong>Generate random inputs</strong> from probability distributions over the domain</li>
<li><strong>Perform deterministic computation</strong> on each random input</li>
<li><strong>Aggregate results</strong> — the average converges to the true answer as N→∞</li>
</ol>
<p><strong>Key insight:</strong> By the Law of Large Numbers, the average of many random samples converges to the expected value. So we can approximate deterministic quantities using random experiments.</p>
<p><strong>Example:</strong> To find π, we randomly throw darts at a square containing a circle. The ratio of darts inside the circle to total darts approximates π/4.</p>`},
  {year:"2025 M", marks:"4", repeats:3, q:"Compare stochastic simulation vs. Monte Carlo method.", occ:[{year:"2014 F", marks:"5", q:"Explain the concept of Monte-Carlo simulation over stochastic simulation"}, {year:"2014 F", marks:"5", q:"Explain the concept of Monte-Carlo simulation over stochastic simulation"}],
   answer:`<h4>Answer</h4>
<table>
<tr><th>Feature</th><th>Monte Carlo Method</th><th>Stochastic Simulation</th></tr>
<tr><td><strong>Nature</strong></td><td>Uses random numbers to solve deterministic problems</td><td>Models systems with inherent randomness</td></tr>
<tr><td><strong>Purpose</strong></td><td>Numerical estimation of mathematical quantities</td><td>Study system behavior over time</td></tr>
<tr><td><strong>Time element</strong></td><td>Typically no time component</td><td>Evolves over simulated time</td></tr>
<tr><td><strong>Examples</strong></td><td>Computing π, evaluating integrals</td><td>Bank queuing, manufacturing process</td></tr>
<tr><td><strong>Randomness role</strong></td><td>Tool for computation</td><td>Inherent part of the system</td></tr>
<tr><td><strong>System model</strong></td><td>No system model needed</td><td>Requires detailed system model</td></tr>
<tr><td><strong>Output</strong></td><td>Single numerical estimate</td><td>Time-series of system states</td></tr>
</table>`},
  {year:"2019 F", marks:"10", repeats:1, q:"A vegetable shopkeeper is trying to determine how much green vegetable he has to purchase. No. of customers: 8(0.35), 10(0.30), 12(0.25), 14(0.10). Kg ordered: 1(0.2), 2(0.4), 3(0.3), 4(0.1). Simulate for 5 days.", occ:[{year:"2019 F", marks:"10", q:"Vegetable shopkeeper simulation: Determine how much green vegetable to purchase. Probability distribution for customers (8,10,12,14) and kg ordered (1,2,3,4) given. Vegetable sells Rs.50/kg, unsold at half price. Simulate for 5 days"}],
   answer:`<h4>Answer</h4>
<p><strong>Step 1: Assign random number ranges for customers/day</strong></p>
<table>
<tr><th>Customers/Day</th><th>Probability</th><th>Cumulative</th><th>Random # Range</th></tr>
<tr><td>8</td><td>0.35</td><td>0.35</td><td>00-34</td></tr>
<tr><td>10</td><td>0.30</td><td>0.65</td><td>35-64</td></tr>
<tr><td>12</td><td>0.25</td><td>0.90</td><td>65-89</td></tr>
<tr><td>14</td><td>0.10</td><td>1.00</td><td>90-99</td></tr>
</table>

<p><strong>Step 2: Assign random number ranges for kg/customer</strong></p>
<table>
<tr><th>Kg Ordered</th><th>Probability</th><th>Cumulative</th><th>Random # Range</th></tr>
<tr><td>1</td><td>0.2</td><td>0.2</td><td>00-19</td></tr>
<tr><td>2</td><td>0.4</td><td>0.6</td><td>20-59</td></tr>
<tr><td>3</td><td>0.3</td><td>0.9</td><td>60-89</td></tr>
<tr><td>4</td><td>0.1</td><td>1.0</td><td>90-99</td></tr>
</table>

<p><strong>Step 3: Simulate 5 days</strong> (using sample random numbers)</p>
<table>
<tr><th>Day</th><th>RN</th><th>Customers</th><th>Avg Kg/Customer</th><th>Total Demand (Kg)</th></tr>
<tr><td>1</td><td>24</td><td>8</td><td>2.3 (E[X]=1×0.2+2×0.4+3×0.3+4×0.1=2.3)</td><td>8 × 2.3 = 18.4</td></tr>
<tr><td>2</td><td>61</td><td>10</td><td>2.3</td><td>10 × 2.3 = 23.0</td></tr>
<tr><td>3</td><td>43</td><td>10</td><td>2.3</td><td>10 × 2.3 = 23.0</td></tr>
<tr><td>4</td><td>78</td><td>12</td><td>2.3</td><td>12 × 2.3 = 27.6</td></tr>
<tr><td>5</td><td>92</td><td>14</td><td>2.3</td><td>14 × 2.3 = 32.2</td></tr>
</table>
<p><strong>Average daily demand = (18.4+23+23+27.6+32.2)/5 = 124.2/5 = 24.84 kg</strong></p>
<p>The shopkeeper should purchase approximately <strong>25 kg</strong> of vegetables per day.</p>
<p><em>Note: In a more detailed simulation, we would generate individual random numbers for EACH customer's order. The expected kg per customer is E[X] = 1(0.2) + 2(0.4) + 3(0.3) + 4(0.1) = 2.3 kg.</em></p>`},
  {year:"2012 C", marks:"5", repeats:1, q:"Solve ∫₁ᵉ dx using Monte Carlo Method",
   answer:`<h4>Answer</h4>

<p><strong>Note on the paper:</strong> as printed the question reads &#8747;&#8321;&#7503; dx with the integrand missing. The two integrals that appear with the limits 1 and e in this syllabus are &#8747;&#8321;&#7503; (1/x) dx and &#8747;&#8321;&#7503; ln x dx, and <strong>both equal exactly 1</strong>. The procedure below is the same for any f(x), so it can be applied whatever the paper intended; &#8747;&#8321;&#7503; (1/x) dx is worked out in full because its exact value is known, which is what lets us report the error.</p>

<div class="worked">

<div class="worked-head"><span>Monte Carlo estimate of &#8747;&#8321;&#7503; (1/x) dx — the sample-mean method</span><span class="meta">N = 10</span></div>

<p class="page-src">Source page: <button class="page-chip" type="button" data-page="n2p37">n2 p37</button></p>

<div class="worked-givens">

<div><span>a</span><b>1</b></div>

<div><span>b</span><b>e = 2.718282</b></div>

<div><span>f(x)</span><b>1 / x</b></div>

<div><span>N</span><b>10</b></div>

</div>

<ol class="worked-steps">

<li><span class="worked-calc">Exact value by calculus:

&#8747;&#8321;&#7503; (1/x) dx = [ ln x ]&#8321;&#7503; = ln e &#8722; ln 1 = 1 &#8722; 0 = 1</span><span class="worked-note">Always obtain the exact value first — the error cannot be reported without it.</span></li>

<li><span class="worked-calc">Sample-mean (crude Monte Carlo) estimator:

I &#8776; (b &#8722; a) &#215; (1/N) &#931; f(x&#7522;),   where x&#7522; = a + (b &#8722; a) R&#7522;

b &#8722; a = e &#8722; 1 = 1.718282

x&#7522; = 1 + 1.718282 R&#7522;</span><span class="worked-note">The width in the first formula is the point of the method: the average height times the base gives the area.</span></li>

<li><span class="worked-calc">Ten uniform random numbers and the corresponding values of f(x) = 1/x:</span>

<table>

<tr><th>i</th><th>R&#7522;</th><th>x&#7522; = 1 + 1.718282 R&#7522;</th><th>f(x&#7522;) = 1/x&#7522;</th></tr>

<tr><td>1</td><td>0.12</td><td>1.2062</td><td>0.8291</td></tr>

<tr><td>2</td><td>0.34</td><td>1.5842</td><td>0.6312</td></tr>

<tr><td>3</td><td>0.56</td><td>1.9622</td><td>0.5096</td></tr>

<tr><td>4</td><td>0.78</td><td>2.3403</td><td>0.4273</td></tr>

<tr><td>5</td><td>0.91</td><td>2.5636</td><td>0.3901</td></tr>

<tr><td>6</td><td>0.23</td><td>1.3952</td><td>0.7167</td></tr>

<tr><td>7</td><td>0.45</td><td>1.7732</td><td>0.5639</td></tr>

<tr><td>8</td><td>0.67</td><td>2.1512</td><td>0.4648</td></tr>

<tr><td>9</td><td>0.89</td><td>2.5293</td><td>0.3954</td></tr>

<tr><td>10</td><td>0.05</td><td>1.0859</td><td>0.9209</td></tr>

</table></li>

<li><span class="worked-calc">&#931; f(x&#7522;) = 5.8491

mean f(x) = 5.8491 / 10 = 0.58491

I &#8776; (e &#8722; 1) &#215; 0.58491 = 1.718282 &#215; 0.58491 = 1.0050</span></li>

<li><span class="worked-calc">Error = |1.0050 &#8722; 1| = 0.0050 &#8776; <strong>0.50 %</strong></span><span class="worked-note">The estimate is close because these ten points happened to spread evenly over [1, e].</span></li>

</ol>

<p class="worked-result">&#8747;&#8321;&#7503; (1/x) dx &#8776; <strong>1.0050</strong>  (exact 1) &nbsp;·&nbsp; error 0.0050 = 0.50 %</p>

</div>

<p><strong>Standard error and confidence interval for full marks.</strong> Deviations (f(x&#7522;) &#8722; 0.58491) give &#931;(f &#8722; mean)&#178; = 0.31126, so s&#178; = 0.31126/9 = 0.034585 and s = 0.18597. The standard error of the estimator is (b &#8722; a)&#183;s/&#8730;N = 1.718282 &#215; 0.18597/3.16228 = <strong>0.1011</strong>, so the 95 % confidence interval is 1.0050 &#177; 1.96 &#215; 0.1011 = (&#8722;0.193, 2.203). It contains 1, which is all a ten-point estimate can honestly claim.</p>

<p><strong>Method, in six lines:</strong> (1) get the exact value if you can; (2) generate N uniform random numbers; (3) map each into [a, b] as x&#7522; = a + (b&#8722;a)R&#7522;; (4) evaluate f at every point; (5) multiply the mean of those values by the width (b &#8722; a); (6) quote the estimate with its error and confidence interval. Accuracy improves as 1/&#8730;N — four times the points halves the error.</p>`},
  {year:"2011 F", marks:"5", repeats:1, q:"Calculate ∫₁⁴ (x+4)³dx using Monte Carlo simulation. Calculate error.",
   answer:`<h4>Answer</h4>
<p><strong>Actual value:</strong> ∫₁⁴ (x+4)³ dx = [(x+4)⁴/4]₁⁴ = (8⁴ - 5⁴)/4 = (4096 - 625)/4 = <strong>867.75</strong></p>
<p><strong>Monte Carlo estimation:</strong></p>
<p>Formula: I ≈ (b-a)/N × Σf(xᵢ) where a=1, b=4, f(x)=(x+4)³</p>
<p>Generate 5 random numbers Rᵢ in [0,1]: 0.82, 0.15, 0.63, 0.45, 0.91</p>
<p>Transform to [1,4]: xᵢ = 1 + 3×Rᵢ</p>
<table>
<tr><th>i</th><th>Rᵢ</th><th>xᵢ = 1+3Rᵢ</th><th>f(xᵢ) = (xᵢ+4)³</th></tr>
<tr><td>1</td><td>0.82</td><td>3.46</td><td>(7.46)³ = 415.16</td></tr>
<tr><td>2</td><td>0.15</td><td>1.45</td><td>(5.45)³ = 161.88</td></tr>
<tr><td>3</td><td>0.63</td><td>2.89</td><td>(6.89)³ = 327.08</td></tr>
<tr><td>4</td><td>0.45</td><td>2.35</td><td>(6.35)³ = 256.05</td></tr>
<tr><td>5</td><td>0.91</td><td>3.73</td><td>(7.73)³ = 461.89</td></tr>
</table>
<p>Σf(xᵢ) = 415.16 + 161.88 + 327.08 + 256.05 + 461.89 = 1622.06</p>
<p><strong>I ≈ (4-1)/5 × 1622.06 = 3/5 × 1622.06 = 973.24</strong></p>
<p><strong>Error = |973.24 - 867.75| = 105.49</strong></p>
<p><em>With more random samples, the error would decrease (error ∝ 1/√N).</em></p>`},
  {year:"2010 C", marks:"5", repeats:1, q:"Define normally distributed random number with example.",
   answer:`<h4>Answer</h4>
<p>A <strong>normally distributed random number</strong> is a random number that follows the normal (Gaussian) distribution with a bell-shaped probability density function. It is characterized by mean (μ) and standard deviation (σ).</p>
<div class="formula-box">f(x) = (1/σ√2π) × e^(-(x-μ)²/2σ²)</div>
<p><strong>Methods to generate:</strong></p>
<p><strong>1. Box-Muller Transform:</strong> Given R₁, R₂ ~ Uniform(0,1):</p>
<p>Z₁ = √(-2 ln R₁) × cos(2πR₂) → Standard Normal N(0,1)</p>
<p><strong>Example:</strong> R₁ = 0.5, R₂ = 0.3</p>
<p>Z₁ = √(-2 × ln(0.5)) × cos(2π × 0.3) = √(1.386) × cos(1.885) = 1.177 × (-0.309) = <strong>-0.364</strong></p>
<p>For normal with μ=100, σ=15: X = 100 + 15×(-0.364) = <strong>94.54</strong></p>
<p><strong>2. Central Limit Theorem:</strong> Z = (ΣR₁₂) - 6, where sum of 12 uniform numbers ≈ N(6,1)</p>`},
  {year:"2010 C", marks:"5", repeats:1, q:"Find the value of ∫₀^(π/2) cos x dx using Monte-Carlo Method", occ:[{year:"2015 F", marks:"5", q:"Calculate ∫₀^(π/2) cos x dx using Monte Carlo simulation"}],
   answer:`<h4>Answer</h4>

<p>Here f(x) = cos x on [0, &#960;/2]. The exact value is &#8747;&#8320;^(&#960;/2) cos x dx = [sin x]&#8320;^(&#960;/2) = 1 &#8722; 0 = 1, so this is a clean check of the Monte Carlo result.</p>

<div class="worked">

<div class="worked-head"><span>Monte Carlo estimate of &#8747;&#8320;^(&#960;/2) cos x dx — sample-mean method</span><span class="meta">N = 10</span></div>

<div class="worked-givens">

<div><span>a</span><b>0</b></div>

<div><span>b</span><b>&#960;/2 = 1.570796</b></div>

<div><span>f(x)</span><b>cos x</b></div>

<div><span>N</span><b>10</b></div>

</div>

<ol class="worked-steps">

<li><span class="worked-calc">Exact value:

&#8747;&#8320;^(&#960;/2) cos x dx = [sin x]&#8320;^(&#960;/2) = sin(&#960;/2) &#8722; sin 0 = 1</span></li>

<li><span class="worked-calc">Estimator:

I &#8776; (b &#8722; a) &#215; (1/N) &#931; cos(x&#7522;),   x&#7522; = (&#960;/2) R&#7522; = 1.570796 R&#7522;</span><span class="worked-note">a = 0, so the mapping is just a scaling of each random number.</span></li>

<li><span class="worked-calc">Ten random numbers, the mapped x&#7522; (radians, with degrees in brackets) and cos x&#7522;:</span>

<table>

<tr><th>i</th><th>R&#7522;</th><th>x&#7522; = 1.570796 R&#7522;</th><th>x&#7522; in degrees</th><th>cos x&#7522;</th></tr>

<tr><td>1</td><td>0.05</td><td>0.0785</td><td>4.5&#176;</td><td>0.9969</td></tr>

<tr><td>2</td><td>0.15</td><td>0.2356</td><td>13.5&#176;</td><td>0.9724</td></tr>

<tr><td>3</td><td>0.25</td><td>0.3927</td><td>22.5&#176;</td><td>0.9239</td></tr>

<tr><td>4</td><td>0.35</td><td>0.5498</td><td>31.5&#176;</td><td>0.8526</td></tr>

<tr><td>5</td><td>0.45</td><td>0.7069</td><td>40.5&#176;</td><td>0.7604</td></tr>

<tr><td>6</td><td>0.55</td><td>0.8639</td><td>49.5&#176;</td><td>0.6494</td></tr>

<tr><td>7</td><td>0.65</td><td>1.0210</td><td>58.5&#176;</td><td>0.5225</td></tr>

<tr><td>8</td><td>0.75</td><td>1.1781</td><td>67.5&#176;</td><td>0.3827</td></tr>

<tr><td>9</td><td>0.85</td><td>1.3352</td><td>76.5&#176;</td><td>0.2334</td></tr>

<tr><td>10</td><td>0.95</td><td>1.4923</td><td>85.5&#176;</td><td>0.0785</td></tr>

</table><span class="worked-note">Convert the radians to degrees first if you are using a calculator in degree mode — a mix-up here is the commonest source of a wrong answer in this question.</span></li>

<li><span class="worked-calc">&#931; cos x&#7522; = 6.3727

mean = 6.3727 / 10 = 0.63727

I &#8776; 1.570796 &#215; 0.63727 = 1.0010</span></li>

<li><span class="worked-calc">Error = |1.0010 &#8722; 1| = 0.0010 &#8776; <strong>0.10 %</strong></span></li>

</ol>

<p class="worked-result">&#8747;&#8320;^(&#960;/2) cos x dx &#8776; <strong>1.0010</strong>  (exact 1) &nbsp;·&nbsp; error 0.0010 = 0.10 %</p>

</div>

<p><strong>Why the error is small here:</strong> cos x varies smoothly over the interval and the ten random numbers fell almost uniformly across it, so the sample mean of the heights is very close to the true mean height of the curve. The result is a <em>statistical</em> one — a different set of ten random numbers would give a slightly different value, which is exactly why the method is repeated with a larger N and reported with a confidence interval.</p>`}
]
};
