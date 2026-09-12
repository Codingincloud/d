window.CHAPTERS = window.CHAPTERS || {};
window.CHAPTERS[4] = {
learn: `
<h2>4.1 Elements of Queuing System</h2>
<p>A <strong>queuing system</strong> (also known as a queuing model) is a mathematical concept used to analyze the behavior of waiting lines or queues.</p>
<div class="concept-box">
<h4>Basic Structure</h4>
<p>Customers → Arrival → Queue (Waiting Line) → Service Facility → Departure</p>
</div>

<h3>Elements</h3>
<ol>
<li><strong>Calling Population:</strong> The source of customers (finite or infinite)</li>
<li><strong>Arrival Process:</strong> How customers arrive (Poisson, deterministic, general distribution)</li>
<li><strong>Queue:</strong> The waiting line before service</li>
<li><strong>Service Mechanism:</strong> Number of servers and how they operate</li>
<li><strong>Service Time Distribution:</strong> Time to serve a customer (exponential, deterministic, normal)</li>
<li><strong>Queue Discipline:</strong> Order of service (FIFO, LIFO, Random, Priority-based)</li>
<li><strong>System Capacity:</strong> Maximum customers the system can hold</li>
<li><strong>Exit/Departure:</strong> How customers leave after service</li>
</ol>

<h2>4.2 Characteristics of a Queuing System</h2>
<p>The behaviour of a waiting line is fixed by a small set of characteristics. Every queuing problem is described by choosing one option from each row of the table below, and those choices are exactly what Kendall's notation has to record.</p>
<table class="comparison-table">
<tr><th>Characteristic</th><th>Options</th><th>Effect on the model</th></tr>
<tr><td><strong>Arrival pattern</strong></td><td>Poisson (random), deterministic (appointments), general</td><td>Poisson arrivals give exponential inter-arrival times</td></tr>
<tr><td><strong>Service pattern</strong></td><td>Exponential, deterministic, general</td><td>Exponential service means a few customers take much longer</td></tr>
<tr><td><strong>Number of servers (channels)</strong></td><td>Single or multiple</td><td>More servers cut waiting time but raise the cost</td></tr>
<tr><td><strong>Number of service phases</strong></td><td>Single phase or multiple phases</td><td>Multiple phases (registration → treatment) require a network of queues</td></tr>
<tr><td><strong>Queue discipline</strong></td><td>FIFO, LIFO, SIRO (random), priority</td><td>Priority changes the waiting time experienced by each class</td></tr>
<tr><td><strong>System capacity</strong></td><td>Finite (bounded) or infinite</td><td>Finite capacity causes blocking and balking</td></tr>
<tr><td><strong>Calling population</strong></td><td>Finite or infinite</td><td>With a finite population the arrival rate falls as the queue grows</td></tr>
<tr><td><strong>Human behaviour</strong></td><td>Balking, reneging, jockeying, collusion</td><td>Cannot be captured by the standard formulas</td></tr>
<tr><td><strong>State of the system</strong></td><td>Transient or steady state</td><td>Formulas such as L = ρ/(1−ρ) hold only in steady state</td></tr>
</table>
<div class="concept-box tip">
<h4>Transient vs Steady State</h4>
<p>The <strong>transient state</strong> is the early period after the system starts empty, when the statistics are still biased by that empty start (this is the initial-bias problem of section 7.4). The <strong>steady state</strong> is reached once the probability distribution of the system state stops changing with time. Analytic formulas are steady-state results, so a simulation must discard its warm-up period before the two can be compared fairly.</p>
</div>
<div class="concept-box">
<h4>Human Behaviour in Queues</h4>
<ul>
<li><strong>Balking:</strong> the customer sees the long queue and refuses to join.</li>
<li><strong>Reneging:</strong> the customer joins but leaves before being served.</li>
<li><strong>Jockeying:</strong> the customer switches from one queue to another.</li>
<li><strong>Collusion:</strong> a group of customers joins the queue together (one person holds the place for several).</li>
</ul>
</div>

<h2>4.3 Types of Queuing System</h2>
<table class="comparison-table">
<tr><th>Type</th><th>Description</th><th>Example</th></tr>
<tr><td><strong>Single Channel, Single Server</strong></td><td>One queue, one server</td><td>Single ATM machine</td></tr>
<tr><td><strong>Multiple Channel, Single Server</strong></td><td>Multiple queues, one server each</td><td>Bank with multiple tellers</td></tr>
<tr><td><strong>Single Channel, Multiple Server</strong></td><td>One queue, multiple servers</td><td>Airport check-in counters</td></tr>
<tr><td><strong>Multiple Channel, Multiple Server</strong></td><td>Multiple queues, multiple servers</td><td>Hospital emergency department</td></tr>
</table>

<h2>4.4 Kendall's Notation</h2>
<p>A standard notation to describe characteristics of a queuing system:</p>
<div class="formula-box">A / S / C / K / N / D</div>
<table class="comparison-table">
<tr><th>Symbol</th><th>Meaning</th><th>Possible Values</th></tr>
<tr><td><strong>A</strong></td><td>Arrival Process Distribution</td><td>M (Markovian/Poisson), D (Deterministic), G (General)</td></tr>
<tr><td><strong>S</strong></td><td>Service Time Distribution</td><td>M (Markovian/Exponential), D (Deterministic), G (General)</td></tr>
<tr><td><strong>C</strong></td><td>Number of Servers</td><td>1, 2, 3, ...</td></tr>
<tr><td><strong>K</strong></td><td>System Capacity</td><td>Optional, default = ∞</td></tr>
<tr><td><strong>N</strong></td><td>Population Size</td><td>Optional, default = ∞</td></tr>
<tr><td><strong>D</strong></td><td>Service Discipline</td><td>FIFO (default), LIFO, Priority</td></tr>
</table>
<div class="example-box">
<h4>Examples</h4>
<p><strong>M/M/1:</strong> Poisson arrivals, Exponential service, 1 server, infinite capacity, infinite population, FIFO</p>
<p><strong>M/M/8/20/500/LIFO:</strong> Poisson arrivals, Exponential service, 8 servers, capacity 20, population 500, LIFO</p>
<p><strong>D/M/1/LIFO/20/95:</strong> Deterministic arrivals, Exponential service, 1 server, LIFO, capacity 20, population 95</p>
</div>

<h2>4.5 Measurement of System Performance</h2>
<div class="concept-box important">
<h4>Important Formulas (for M/M/1 queue)</h4>
<p>These formulas are very important for exam problems!</p>
</div>
<table class="comparison-table">
<tr><th>Metric</th><th>Formula</th><th>Description</th></tr>
<tr><td><strong>Arrival Rate (λ)</strong></td><td>λ = customers/unit time</td><td>Average arrivals per unit time</td></tr>
<tr><td><strong>Service Rate (μ)</strong></td><td>μ = customers/unit time</td><td>Average customers served per unit time</td></tr>
<tr><td><strong>Traffic Intensity (ρ)</strong></td><td>ρ = λ/μ</td><td>Must be < 1 for stable system</td></tr>
<tr><td><strong>Avg customers in system (L)</strong></td><td>L = ρ/(1-ρ)</td><td>Average number in entire system</td></tr>
<tr><td><strong>Avg customers in queue (Lq)</strong></td><td>Lq = ρ²/(1-ρ)</td><td>Average waiting in queue only</td></tr>
<tr><td><strong>Avg time in system (W)</strong></td><td>W = 1/μ(1-ρ)</td><td>Average total time spent</td></tr>
<tr><td><strong>Avg waiting time in queue (Wq)</strong></td><td>Wq = ρ/μ(1-ρ)</td><td>Average wait before service</td></tr>
<tr><td><strong>Idle probability (P₀)</strong></td><td>P₀ = 1-ρ</td><td>Probability system is empty</td></tr>
<tr><td><strong>n customers probability (Pₙ)</strong></td><td>Pₙ = (1-ρ)ρⁿ</td><td>Probability of n customers in system</td></tr>
</table>

<div class="worked">
<div class="worked-head"><span>Hospital emergency — M/M/1 performance measures</span><span class="meta">worked · all seven measures from λ and μ</span></div>
<div class="worked-givens">
<div><span>Arrivals</span><b>72 patients / day</b></div>
<div><span>Service time</span><b>12 min / patient</b></div>
<div><span>Servers</span><b>1 (M/M/1)</b></div>
</div>
<ol class="worked-steps">
<li><span class="worked-calc">λ = 72 / (24 × 60) = 72 / 1440 = 0.05 patients per minute</span><span class="worked-note">λ and μ must share ONE time unit — minutes here, because the service time is in minutes.</span></li>
<li><span class="worked-calc">μ = 1 / 12 = 0.08333 patients per minute</span></li>
<li><span class="worked-calc">ρ = λ / μ = 0.05 / 0.08333 = 0.60</span><span class="worked-note">ρ &lt; 1, so the queue is stable — say this before quoting any other number.</span></li>
<li><span class="worked-calc">L  = ρ/(1 − ρ)    = 0.6/0.4       = 1.5 patients in the system</span></li>
<li><span class="worked-calc">Lq = ρ²/(1 − ρ)   = 0.36/0.4      = 0.9 patients waiting in the queue</span></li>
<li><span class="worked-calc">Wq = ρ/[μ(1 − ρ)] = 0.6/0.03333   = 18 minutes average wait</span></li>
<li><span class="worked-calc">W  = 1/[μ(1 − ρ)] = 1/0.03333     = 30 minutes total time in the system</span></li>
<li><span class="worked-calc">P₀ = 1 − ρ = 0.40  →  the single server is idle 40% of the time</span><span class="worked-note">Check: W = Wq + 1/μ = 18 + 12 = 30 ✓ and L = λW = 0.05 × 30 = 1.5 ✓</span></li>
</ol>
<div class="worked-result"><span>ρ = 0.6</span><b>L = 1.5 · Lq = 0.9 · Wq = 18 min · W = 30 min · P₀ = 0.40</b></div>
</div>

<h2>4.6 Application of Queuing System</h2>
<ul>
<li><strong>Telecommunications:</strong> Optimizing network traffic, data packet handling</li>
<li><strong>Healthcare:</strong> Patient flow, reducing waiting times</li>
<li><strong>Manufacturing:</strong> Assembly line optimization, reducing bottlenecks</li>
<li><strong>Transportation:</strong> Bus stations, traffic lights, airport security</li>
<li><strong>Banking:</strong> Customer service, teller allocation</li>
</ul>

<h2>4.7 Markov Chain</h2>
<p>A <strong>Markov chain</strong> is a mathematical model for a process that moves step by step through various states.</p>
<h3>Properties</h3>
<ol>
<li>The outcome of each experiment is one of a set of <strong>discrete states</strong></li>
<li>The outcome depends only on the <strong>present state</strong>, not any past state (memoryless property)</li>
<li>The transition probabilities remain <strong>constant</strong> from one transition to next</li>
</ol>

<h3>Steps for Future Prediction</h3>
<ol>
<li>Create current state distribution matrix <strong>Q₀</strong></li>
<li>Create the transition probability matrix <strong>P</strong></li>
<li>Calculate <strong>Q = Q₀ × Pⁿ</strong> (probability vector after n transitions)</li>
</ol>

<div class="worked">
<div class="worked-head"><span>Markov chain — Honda / Yamaha purchase after 3 purchases</span><span class="meta">2026 pattern · P³ worked by hand</span></div>
<div class="worked-givens">
<div><span>Honda → Honda</span><b>0.70</b></div>
<div><span>Honda → Yamaha</span><b>0.30</b></div>
<div><span>Yamaha → Yamaha</span><b>0.80</b></div>
<div><span>Yamaha → Honda</span><b>0.20</b></div>
<div><span>Current state</span><b>Q₀ = [1, 0] (Honda user)</b></div>
</div>
<ol class="worked-steps">
<li><span class="worked-calc">Transition matrix   H      Y
              H ⎡ 0.70   0.30 ⎤
          P =   ⎣              ⎦
              Y ⎢ 0.20   0.80 ⎥</span><span class="worked-note">Each ROW must add to 1: it is the distribution of the next purchase given the current one.</span></li>
<li><span class="worked-calc">P² = P × P
   row H: [0.70×0.70 + 0.30×0.20,  0.70×0.30 + 0.30×0.80] = [0.55, 0.45]
   row Y: [0.20×0.70 + 0.80×0.20,  0.20×0.30 + 0.80×0.80] = [0.30, 0.70]</span></li>
<li><span class="worked-calc">P³ = P² × P
   row H: [0.55×0.70 + 0.45×0.20,  0.55×0.30 + 0.45×0.80] = [0.475, 0.525]</span></li>
<li><span class="worked-calc">Q = Q₀ × P³ = [1, 0] × P³ = first row of P³ = [0.475, 0.525]</span><span class="worked-note">Starting as a Honda user you only need row H — the second row answers the same question for a Yamaha user.</span></li>
</ol>
<div class="worked-result"><span>P(Yamaha after 3 purchases) = 0.525</span><b>52.5%</b></div>
</div>
`,

quiz: [
  {q:"Which is NOT an element of a queuing system?", options:["Calling population","Arrival process","CPU utilization","Queue discipline"], answer:2, explanation:"CPU utilization is a computer metric, not an element of queuing systems. Elements include calling population, arrival process, queue, service mechanism, etc."},
  {q:"In Kendall's notation M/M/1, what does the first M represent?", options:["Service distribution","Number of servers","Arrival process distribution","Queue discipline"], answer:2, explanation:"In A/S/C notation, the first position (A) represents the arrival process distribution. M means Markovian/Poisson arrivals."},
  {q:"Traffic intensity ρ must be ___ for a stable system:", options:["Greater than 1","Equal to 1","Less than 1","Zero"], answer:2, explanation:"For a stable queuing system, ρ = λ/μ must be less than 1. If ρ ≥ 1, the queue grows without bound."},
  {q:"If λ=5 and μ=10, the average number of customers in the system (L) is:", options:["0.5","1","2","5"], answer:1, explanation:"ρ = 5/10 = 0.5. L = ρ/(1-ρ) = 0.5/0.5 = 1 customer."},
  {q:"The probability the system is idle (P₀) equals:", options:["ρ","1-ρ","ρ²","1/ρ"], answer:1, explanation:"P₀ = 1-ρ, which is the probability that there are zero customers in the system."},
  {q:"FIFO stands for:", options:["First In First Out","First In Final Out","Final Input First Output","First Index First Order"], answer:0, explanation:"FIFO = First In, First Out. The customer who arrives first is served first."},
  {q:"A Markov chain depends on:", options:["All past states","Only present state","Future predictions","Random events only"], answer:1, explanation:"The Markov property (memoryless): The outcome depends only on the present state, not any past state."},
  {q:"In the Honda-Yamaha example, P(Yamaha after 3 purchases | current Honda user) =", options:["0.475","0.525","0.300","0.700"], answer:1, explanation:"Using Q = Q₀ × P³ where Q₀ = [1,0], the result is [0.475, 0.525]. So P(Yamaha) = 0.525."},
  {q:"Which Kendall notation represents: Poisson arrivals, 8 servers, capacity 20?", options:["M/M/8/20","M/G/8","M/M/1/20","D/M/8/20"], answer:0, explanation:"M/M/8/20 means Markovian arrivals, Markovian service, 8 servers, capacity 20."},
  {q:"For a hospital with ρ=0.6, the average queue length Lq is:", options:["0.6","0.9","1.5","2.4"], answer:1, explanation:"Lq = ρ²/(1-ρ) = 0.36/0.4 = 0.9 patients waiting in queue."}
],

past: [
  {year:"2019 F", marks:"5", repeats:4, q:"Markov Chain (Short Note)",
   answer:`<h4>Answer</h4>
<p>A <strong>Markov chain</strong> is a mathematical model for a process that moves step by step through various states. It consists of <strong>states</strong> and <strong>transition probabilities</strong>.</p>
<p><strong>Properties:</strong></p>
<ol>
<li>Outcome of each experiment is one of a set of <strong>discrete states</strong></li>
<li>Outcome depends only on the <strong>present state</strong>, not any past state (memoryless/Markov property)</li>
<li>Transition probabilities remain <strong>constant</strong> from one transition to next</li>
</ol>
<p><strong>Steps for prediction:</strong></p>
<ol>
<li>Create initial state vector Q₀</li>
<li>Create transition probability matrix P</li>
<li>Calculate Q = Q₀ × Pⁿ for n transitions</li>
</ol>
<p><strong>Applications:</strong> Weather forecasting, traffic systems, telephone systems, PageRank algorithm, stock market analysis.</p>`},
  {year:"2014 F", marks:"10", repeats:4, q:"Computing facility of PU has large no. of personal computers. 50% of days: 0 failures, 30%: 1 failure, 20%: 2 failures. Repair: 40% in 1 day, 35% in 2 days, 25% in 3 days. Verify service person's claim of being overloaded.", occ:[{year:"2014 F, 2010 F", marks:"10", q:"Computing facility of Purbanchal University — On 50% days no failure, 30% days 1 failure, 20% days 2 failures. Repair: 40% in 1 day, 35% in 2, 25% in 3. Simulate 30 days. Compute efficiency, waiting computers, avg waiting time"}],
   answer:`<h4>Answer</h4>
<p>The question asks for a 30-day manual simulation, so the first thing to set up is the random-number mapping for each of the two distributions. Both are given, so the intervals are fixed - each block is 100 &#215; the probability:</p>
<table>
<tr><th>Machines failing per day</th><th>Probability</th><th>Cumulative</th><th>Random numbers</th></tr>
<tr><td>0</td><td>0.50</td><td>0.50</td><td>00 - 49</td></tr>
<tr><td>1</td><td>0.30</td><td>0.80</td><td>50 - 79</td></tr>
<tr><td>2</td><td>0.20</td><td>1.00</td><td>80 - 99</td></tr>
</table>
<table>
<tr><th>Repair time</th><th>Probability</th><th>Cumulative</th><th>Random numbers</th></tr>
<tr><td>1 day</td><td>0.40</td><td>0.40</td><td>00 - 39</td></tr>
<tr><td>2 days</td><td>0.35</td><td>0.75</td><td>40 - 74</td></tr>
<tr><td>3 days</td><td>0.25</td><td>1.00</td><td>75 - 99</td></tr>
</table>
<p>The 30 days are then read off these two tables with a random-digit stream, exactly as in the library problem: one block of digits gives the number of failures on each day, and one digit per failed machine gives its repair time. The service person repairs one machine at a time (FIFO), so a machine that fails while he is busy joins the queue and its waiting time is counted. State the two digit streams you used, because no digits are printed in the question.</p>
<p>What follows is the check the question actually asks for - whether the service person's claim of being overloaded is correct. The mean rates settle it without depending on which 30 days were drawn:</p>
<p><strong>Failure arrival rate (λ):</strong></p>
<p>λ = 0.50×0 + 0.30×1 + 0.20×2 = <strong>0.70 machines per day</strong></p>
<p><strong>Average service time (T):</strong></p>
<p>T = 1×0.40 + 2×0.35 + 3×0.25 = 0.40 + 0.70 + 0.75 = <strong>1.85 days per machine</strong></p>
<p><strong>Service rate (μ):</strong></p>
<p>μ = 1/T = 1/1.85 = <strong>0.54 machines per day</strong></p>
<p><strong>System utilization (ρ):</strong></p>
<p>ρ = λ/μ = 0.70/0.54 = <strong>1.30</strong></p>
<div class="concept-box important">
<h4>Since ρ > 1, the system is OVERLOADED!</h4>
<p>The arrival rate exceeds the service rate. The queue will grow without bound.</p>
</div>
<p><strong>Average machines waiting:</strong></p>
<p>Lq = λ²/μ(μ-λ) = 0.70²/(0.54×(0.54-0.70)) = 0.49/(0.54×(-0.16)) = 0.49/(-0.0864) = <strong>-5.67</strong></p>
<p><em>Negative sign indicates system is overloaded and unstable</em></p>
<p><strong>Average waiting time:</strong></p>
<p>Wq = λ/μ(μ-λ) = 0.70/(0.54×(0.54-0.70)) = 0.70/(-0.0864) = <strong>-8.10 days</strong></p>
<p><strong>Conclusion:</strong> Since ρ=1.30 > 1, the service person's claim is CORRECT. The system is overloaded — a second service person must be hired.</p>`},
  {year:"2015 F, 2011 F, 2010 F", marks:"5", repeats:3, q:"Explain the arrival and departure routine queuing model for a banking system", occ:[{year:"2015 F", marks:"", q:"Explain the arrival and departure routine queuing model for a banldng system. s"}, {year:"2010 F", marks:"5", q:"Consider -the Banking system, to explain the arrival and departure routine queuing model for this banking system"}],
   answer:`<h4>Answer</h4>

<p>A queuing system is simulated by keeping only two routines — an <strong>arrival routine</strong> and a <strong>departure routine</strong> — and letting the clock jump from one of them to the next. Every other rule of the bank (queue discipline, number of tellers, statistics) is expressed inside these two routines, which is why they are asked together.</p>

<h4>Arrival routine</h4>

<div class="code-block">ARRIVAL ROUTINE

1. Generate the inter-arrival time and schedule the NEXT arrival:

      A_next = clock_now + sample(inter-arrival distribution)

2. Increment the number of customers in the system:  N = N + 1

3. Statistics for the arriving customer:

      record arrival time, record N (queue length seen on arrival)

4. If a teller is IDLE:

      a teller becomes BUSY            (IDLE = IDLE - 1, BUSY = BUSY + 1)

      waiting time of this customer = 0

      schedule a DEPARTURE event at  clock_now + sample(service time)

   else:

      join the queue                   (QUEUE = QUEUE + 1)

      the customer waits until a teller is released

5. Update the time-average statistics (area under N(t) and Q(t))

6. Return control to the timing routine</div>

<h4>Departure routine</h4>

<div class="code-block">DEPARTURE ROUTINE  (a teller finished serving a customer)

1. Free the teller:  BUSY = BUSY - 1

2. Statistics for the departing customer:

      time in system = clock_now - arrival_time

      waiting time   = start_of_service - arrival_time

      accumulate the totals for the averages

3. N = N - 1

4. If the queue is not empty:

      remove the FIRST customer (FIFO discipline)

      QUEUE = QUEUE - 1

      the teller becomes BUSY again

      waiting time of that customer = clock_now - its arrival time

      schedule a DEPARTURE at  clock_now + sample(service time)

   else:

      the teller becomes IDLE

5. Update the time-average statistics

6. Return control to the timing routine</div>

<h4>Applied to a banking system</h4>

<p>Take a branch with <strong>two tellers and one common queue</strong>. The state of the system is (N&#8342; tellers busy, number waiting), and the two event types are "customer arrives" and "a teller becomes free".</p>

<div class="worked">

<div class="worked-head"><span>Event trace, first few events of a bank run</span><span class="meta">2 tellers · queue discipline FIFO</span></div>

<div class="worked-givens">

<div><span>Clock 0</span><b>both tellers IDLE, QUEUE = 0</b></div>

<div><span>Next event</span><b>arrival at t = 3</b></div>

</div>

<ol class="worked-steps">

<li><span class="worked-calc">t = 3 &nbsp; ARRIVAL. Tellers: 2 idle &#8594; this customer starts service at once (wait = 0).

BUSY = 1. Departure scheduled at 3 + 6 = 9. Next arrival at 3 + 4 = 7.</span></li>

<li><span class="worked-calc">t = 7 &nbsp; ARRIVAL. One teller still idle &#8594; served immediately (wait = 0).

BUSY = 2. Departure at 7 + 5 = 12. Next arrival at 7 + 2 = 9.</span></li>

<li><span class="worked-calc">t = 9 &nbsp; ARRIVAL. Both tellers busy &#8594; the customer joins the queue. QUEUE = 1, N = 3. Next arrival at 9 + 6 = 15.</span><span class="worked-note">The arrival routine does NOT schedule a departure when the queue is used — the departure is created later, by the departure routine, when a teller is freed.</span></li>

<li><span class="worked-calc">t = 9 &nbsp; DEPARTURE (the teller from t = 3). BUSY = 1, N = 2. Queue is not empty, so the waiting customer goes straight into service: QUEUE = 0, BUSY = 2, waiting time = 9 &#8722; 9 = 0. Its departure is scheduled at 9 + 5 = 14.</span></li>

<li><span class="worked-calc">Statistics carried along: total waiting time, total time in system, maximum queue length, number of customers served, and the time-averages of N and QUEUE found by accumulating area under the step curves divided by the run length.</span></li>

</ol>

<p class="worked-result">Utilisation of the tellers = total busy time / (run length &#215; number of tellers); mean waiting time = &#931; waiting times / customers served.</p>

</div>

<p><strong>Why the two routines must be separate:</strong> arrivals and departures are the only instants at which the state can change, so the clock never needs to be advanced in fixed steps. The <em>timing routine</em> simply takes the smaller of the two scheduled event times, which makes the simulation both exact and fast. All the performance measures of the bank are then accumulated inside these routines, which is the whole point of structuring the model this way.</p>`},
  {year:"2025 M", marks:"4", repeats:2, q:"What are the elements of a queuing system?", occ:[{year:"2025 M", marks:"2", q:"List two queuing system characteristics."}],
   variants:[{year:"2025 M", marks:"2", q:"List two queuing system characteristics.", answer:`<h4>Answer</h4>
<p>Two important characteristics of a queuing system:</p>
<ol>
<li><strong>Arrival Process:</strong> The pattern in which customers arrive at the system. It can follow Poisson distribution, deterministic pattern, or general distribution. It defines the arrival rate (λ).</li>
<li><strong>Service Mechanism:</strong> Describes the number of servers, how they operate, and the service time distribution (exponential, deterministic, or normal). It defines the service rate (μ).</li>
</ol>`}],
   answer:`<h4>Answer</h4>
<p>The key elements of a queuing system are:</p>
<ol>
<li><strong>Calling Population:</strong> Source of customers that arrive (finite or infinite)</li>
<li><strong>Arrival Process:</strong> Pattern of arrivals (Poisson, deterministic, general)</li>
<li><strong>Queue:</strong> The waiting line before service begins</li>
<li><strong>Service Mechanism:</strong> Number of servers and how they operate</li>
<li><strong>Service Time Distribution:</strong> Statistical distribution of service duration (exponential, deterministic, normal)</li>
<li><strong>Queue Discipline:</strong> Rule for selecting next customer (FIFO, LIFO, Priority, Random)</li>
<li><strong>System Capacity:</strong> Maximum customers the system can hold</li>
<li><strong>Exit/Departure:</strong> How customers leave after being served</li>
</ol>`},
  {year:"2019 F", marks:"5", repeats:2, q:"Kendall's Notation (Short Note)", occ:[{year:"2011 C", marks:"5", q:"Explain the Kendall's notation in queuing system with example"}],
   answer:`<h4>Answer</h4>
<p><strong>Kendall's Notation</strong> is a standard notation used to describe queuing systems in the form: <strong>A/S/C/K/N/D</strong></p>
<ul>
<li><strong>A</strong> = Arrival process distribution (M=Markovian/Poisson, D=Deterministic, G=General)</li>
<li><strong>S</strong> = Service time distribution (M=Exponential, D=Deterministic, G=General)</li>
<li><strong>C</strong> = Number of servers</li>
<li><strong>K</strong> = System capacity (default: ∞)</li>
<li><strong>N</strong> = Population size (default: ∞)</li>
<li><strong>D</strong> = Service discipline (default: FIFO)</li>
</ul>
<p><strong>Examples:</strong></p>
<ul>
<li>M/M/1 — Simplest queuing model (Poisson arrival, Exponential service, 1 server)</li>
<li>M/M/8/20/500/LIFO — 8 servers, capacity 20, population 500, LIFO discipline</li>
</ul>`},
  {year:"2012 C", marks:"10", repeats:2, q:"For 8 customers, the inter-arrival time and service time in a single counter of a bank are given. Develop a simulation table. Inter-arrival: 0.4, 1.2, 0.5, 1.7, 0.2, 1.6, 0.2, 1.8. Service: 2.0, 0.7, 0.2, 1.1, 3.7, 0.6, 0.4, 0.7", occ:[{year:"2012 C", marks:"10", q:"Bank simulation for 8 customers (inter-arrival time and service time given) — find average waiting time, probability of wait, average queue length"}],
   answer:`<h4>Answer</h4>
<p><strong>Formulas:</strong></p>
<ul>
<li>Actual Arrival Time = Cumulative of inter-arrival time</li>
<li>Service Start Time = max(Arrival Time, Previous Service End Time)</li>
<li>Service End Time = Service Start Time + Service Time</li>
<li>Waiting Time = Service Start Time - Actual Arrival Time</li>
</ul>
<table>
<tr><th>Cust</th><th>Inter-arrival</th><th>Arrival</th><th>Service Start</th><th>Service Time</th><th>Service End</th><th>Wait</th></tr>
<tr><td>1</td><td>0.4</td><td>0.4</td><td>0.4</td><td>2.0</td><td>2.4</td><td>0</td></tr>
<tr><td>2</td><td>1.2</td><td>1.6</td><td>2.4</td><td>0.7</td><td>3.1</td><td>0.8</td></tr>
<tr><td>3</td><td>0.5</td><td>2.1</td><td>3.1</td><td>0.2</td><td>3.3</td><td>1.0</td></tr>
<tr><td>4</td><td>1.7</td><td>3.8</td><td>3.8</td><td>1.1</td><td>4.9</td><td>0</td></tr>
<tr><td>5</td><td>0.2</td><td>4.0</td><td>4.9</td><td>3.7</td><td>8.6</td><td>0.9</td></tr>
<tr><td>6</td><td>1.6</td><td>5.6</td><td>8.6</td><td>0.6</td><td>9.2</td><td>3.0</td></tr>
<tr><td>7</td><td>0.2</td><td>5.8</td><td>9.2</td><td>0.4</td><td>9.6</td><td>3.4</td></tr>
<tr><td>8</td><td>1.8</td><td>7.6</td><td>9.6</td><td>0.7</td><td>10.3</td><td>2.0</td></tr>
</table>
<p><strong>i) Average waiting time</strong> = (0+0.8+1.0+0+0.9+3.0+3.4+2.0)/8 = 11.1/8 = <strong>1.3875 min</strong></p>
<p><strong>ii) Probability of waiting</strong> = 6/8 = <strong>0.75 = 75%</strong> (6 out of 8 customers waited)</p>
<p><strong>iii) Average customers in queue</strong> = Total waiting time / Total arrival span = 11.1 / (7.6-0.4) = 11.1/7.2 = <strong>1.542</strong></p>`},
  {year:"2025 M", marks:"8", repeats:1, q:"Simulate a bank queuing system using Kendall's notation. Discuss performance metrics like average wait time. [4+4]",
   answer:`<h4>Answer</h4>
<h4>Part 1: Bank Queuing System in Kendall's Notation</h4>
<p>A typical bank with single teller: <strong>M/M/1</strong></p>
<ul>
<li><strong>M</strong> (first): Customers arrive following Poisson distribution</li>
<li><strong>M</strong> (second): Service times follow Exponential distribution</li>
<li><strong>1</strong>: Single server (one teller)</li>
<li>Infinite capacity, infinite population, FIFO discipline (defaults)</li>
</ul>
<p>If the bank has 3 tellers with capacity 50: <strong>M/M/3/50</strong></p>
<h4>Part 2: Performance Metrics</h4>
<p>For M/M/1 with λ=0.05, μ=0.0833 (hospital example):</p>
<table>
<tr><th>Metric</th><th>Formula</th><th>Value</th></tr>
<tr><td>Traffic Intensity (ρ)</td><td>λ/μ = 0.05/0.0833</td><td>0.6</td></tr>
<tr><td>Avg customers in system (L)</td><td>ρ/(1-ρ)</td><td>1.5</td></tr>
<tr><td>Avg customers in queue (Lq)</td><td>ρ²/(1-ρ)</td><td>0.9</td></tr>
<tr><td>Avg time in system (W)</td><td>1/μ(1-ρ)</td><td>30 min</td></tr>
<tr><td>Avg wait time in queue (Wq)</td><td>ρ/μ(1-ρ)</td><td>18 min</td></tr>
<tr><td>Idle probability (P₀)</td><td>1-ρ</td><td>0.4 (40%)</td></tr>
</table>`},
  {year:"2011 C", marks:"2+3", repeats:1, q:"What is queuing system? Why do we use queuing system in simulation?", occ:[{year:"2011 C", marks:"2+3+5", q:"What is queuing system? Why do we use queuing system in simulation? Explain the Kendell's notation in queuing system with example"}],
   answer:`<h4>Answer</h4>

<h4>What is a queuing system?</h4>

<p>A <strong>queuing system</strong> is any system in which customers arrive at a service facility, are served if a server is free, and otherwise wait in a queue until a server becomes available. Formally it is described by Kendall's notation <strong>A / S / c / K / d</strong> — arrival distribution, service-time distribution, number of servers, system capacity and queue discipline.</p>

<p><strong>Its five elements:</strong></p>

<ol>

<li><strong>Calling population:</strong> the source of customers — finite (a set of machines) or infinite (customers on the street).</li>

<li><strong>Arrival process:</strong> the distribution of inter-arrival times, most often Poisson (exponential inter-arrival times).</li>

<li><strong>Service mechanism:</strong> the number of servers and the service-time distribution, most often exponential.</li>

<li><strong>Queue discipline:</strong> the rule for choosing the next customer — FIFO, LIFO, priority, shortest-job-first.</li>

<li><strong>Capacity:</strong> how many customers may wait; a finite capacity creates balking, reneging or blocking.</li>

</ol>

<h4>Why we use queuing systems in simulation</h4>

<ul>

<li><strong>Analytical queuing theory only covers simple cases.</strong> M/M/1 and M/M/c have closed-form answers, but real systems have non-exponential arrivals, priority classes, impatient customers, finite buffers and servers that break down. Once any of these is present there is no formula, and simulation is the only way to get numbers.</li>

<li><strong>To predict performance before the system is built or changed.</strong> Mean waiting time, mean queue length, server utilisation, the probability of a long wait and the probability of rejection can all be estimated from the model — the same quantities that a manager wants to know.</li>

<li><strong>To test "what-if" policies cheaply and safely.</strong> Add a teller, open a second channel, change the queue discipline, vary the shift pattern — all without disturbing the real service or the real customers.</li>

<li><strong>To balance the two costs.</strong> Every extra server costs money; every waiting customer costs goodwill. A queuing simulation quantifies the trade-off, which is the real reason the model is built.</li>

<li><strong>To find the bottleneck.</strong> A single simulation run exposes which stage starves the others, information that averages alone cannot give.</li>

<li><strong>Because the same structure recurs everywhere:</strong> bank counters, hospital OPD and emergency, call centres, supermarket checkouts, traffic at a signal, jobs at a CPU, aircraft waiting for a runway, machines waiting for a repairman.</li>

</ul>

<p><strong>Typical output of such a simulation:</strong> average waiting time, average time in the system (waiting + service — Little's law gives L = &#955;W), average and maximum queue length, server utilisation, and the distribution of waiting time, not just its mean.</p>`},
  {year:"2010 C", marks:"10", repeats:1, q:"Consider the following table for time between arrivals of customers and their service times in a library system. Time between arrivals (min): 1→0.23, 2→0.37, 3→0.25, 4→0.15. Service time (min): 1→0.10, 2→0.20, 3→0.33, 4→0.22, 5→0.10, 6→0.05. Do a manual simulation for 15 customers and calculate average waiting time, average time a customer has to spend in the system and the probability of server being busy.", occ:[{year:"2010 C", marks:"10", q:"Consider the following table for time between arrivals of customers and their service times in a library system [arrival and service probability tables given]. Do a manual simulation for 15 customers and calculate average waiting time, average time a customer has to spend in the system, and the probability of server being busy"}],
   answer:`<h4>Answer</h4>

<p>A single librarian (one server) serves 15 customers who join one common queue. The question does not list the inter-arrival and service times: it gives their <em>distributions</em>, so the first job is to turn each distribution into the block of random numbers it owns, and then to trace the 15 customers against those blocks. With single-server, FIFO service the trace reduces to the recurrence</p>

<div class="formula-box"><span class="fb-label">Recurrence used</span>

A&#7522; = A&#7522;&#8331;&#8321; + IAT&#7522;&nbsp;&nbsp;(arrival time)

S&#7522; = max(A&#7522;, D&#7522;&#8331;&#8321;)&nbsp;&nbsp;(service starts at the later of arrival or the previous departure)

W&#7522; = S&#7522; &#8722; A&#7522;&nbsp;&nbsp;(waiting time)&nbsp;&nbsp;&#183;&nbsp;&nbsp;D&#7522; = S&#7522; + ST&#7522;&nbsp;&nbsp;(departure)

T&#7522; = D&#7522; &#8722; A&#7522; = W&#7522; + ST&#7522;&nbsp;&nbsp;(time in system)</div>

<div class="worked">

<div class="worked-head"><span>Single-server library counter — 15 customers simulated by hand</span><span class="meta">FIFO · all times in minutes</span></div>

<div class="worked-givens">

<div><span>Inter-arrival distribution</span><b>1 min → 0.23&nbsp;·&nbsp;2 min → 0.37&nbsp;·&nbsp;3 min → 0.25&nbsp;·&nbsp;4 min → 0.15</b></div>

<div><span>Service-time distribution</span><b>1 min → 0.10&nbsp;·&nbsp;2 min → 0.20&nbsp;·&nbsp;3 min → 0.33&nbsp;·&nbsp;4 min → 0.22&nbsp;·&nbsp;5 min → 0.10&nbsp;·&nbsp;6 min → 0.05</b></div>

<div><span>Servers</span><b>1 librarian</b></div>

<div><span>Queue</span><b>single, FIFO</b></div>

<div><span>Random digits</span><b>arrival stream 62 17 84 41 95 28 73 06 55 39 88 12 67 24 91&nbsp;·&nbsp;service stream 12 58 34 05 81 46 27 69 38 93 15 72 49 08 64</b></div>

</div>

<ol class="worked-steps">

<li><span class="worked-calc"><strong>Step 1 - give every outcome the random numbers it owns.</strong> Read the cumulative probability off the question's table and lay the outcomes end to end from 00. Each block is 100 &#215; its probability, so nothing here is chosen by us.

<table>
<tr><th>Time between arrivals</th><th>Probability</th><th>Cumulative</th><th>Random numbers</th></tr>
<tr><td>1 min</td><td>0.23</td><td>0.23</td><td>00 - 22</td></tr>
<tr><td>2 min</td><td>0.37</td><td>0.60</td><td>23 - 59</td></tr>
<tr><td>3 min</td><td>0.25</td><td>0.85</td><td>60 - 84</td></tr>
<tr><td>4 min</td><td>0.15</td><td>1.00</td><td>85 - 99</td></tr>
</table>

<table>
<tr><th>Service time</th><th>Probability</th><th>Cumulative</th><th>Random numbers</th></tr>
<tr><td>1 min</td><td>0.10</td><td>0.10</td><td>00 - 09</td></tr>
<tr><td>2 min</td><td>0.20</td><td>0.30</td><td>10 - 29</td></tr>
<tr><td>3 min</td><td>0.33</td><td>0.63</td><td>30 - 62</td></tr>
<tr><td>4 min</td><td>0.22</td><td>0.85</td><td>63 - 84</td></tr>
<tr><td>5 min</td><td>0.10</td><td>0.95</td><td>85 - 94</td></tr>
<tr><td>6 min</td><td>0.05</td><td>1.00</td><td>95 - 99</td></tr>
</table></span><span class="worked-note">Two checks worth showing: each distribution sums to 1.00 (so the last block ends at 99), and each block is 100 &#215; the probability - 0.23 &#8594; 23 numbers (00-22), 0.33 &#8594; 33 numbers (30-62).</span></li>

<li><span class="worked-calc"><strong>Step 2 - trace the 15 customers.</strong> The paper supplies no random digits, so they must come from a random-number table; the two streams printed in the givens are the ones used below, so every row can be re-derived. Any other block gives a different - equally valid - run, because this is one replication of a stochastic system.</span>

<table>

<tr><th>#</th><th>Random digit</th><th>IAT</th><th>Random digit</th><th>ST</th><th>A&#7522; arrives</th><th>S&#7522; starts</th><th>W&#7522; waits</th><th>D&#7522; departs</th><th>T&#7522; in system</th></tr>

<tr><td>1</td><td>62</td><td>3</td><td>12</td><td>2</td><td>3</td><td>3</td><td>0</td><td>5</td><td>2</td></tr>

<tr><td>2</td><td>17</td><td>1</td><td>58</td><td>3</td><td>4</td><td>5</td><td>1</td><td>8</td><td>4</td></tr>

<tr><td>3</td><td>84</td><td>3</td><td>34</td><td>3</td><td>7</td><td>8</td><td>1</td><td>11</td><td>4</td></tr>

<tr><td>4</td><td>41</td><td>2</td><td>05</td><td>1</td><td>9</td><td>11</td><td>2</td><td>12</td><td>3</td></tr>

<tr><td>5</td><td>95</td><td>4</td><td>81</td><td>4</td><td>13</td><td>13</td><td>0</td><td>17</td><td>4</td></tr>

<tr><td>6</td><td>28</td><td>2</td><td>46</td><td>3</td><td>15</td><td>17</td><td>2</td><td>20</td><td>5</td></tr>

<tr><td>7</td><td>73</td><td>3</td><td>27</td><td>2</td><td>18</td><td>20</td><td>2</td><td>22</td><td>4</td></tr>

<tr><td>8</td><td>06</td><td>1</td><td>69</td><td>4</td><td>19</td><td>22</td><td>3</td><td>26</td><td>7</td></tr>

<tr><td>9</td><td>55</td><td>2</td><td>38</td><td>3</td><td>21</td><td>26</td><td>5</td><td>29</td><td>8</td></tr>

<tr><td>10</td><td>39</td><td>2</td><td>93</td><td>5</td><td>23</td><td>29</td><td>6</td><td>34</td><td>11</td></tr>

<tr><td>11</td><td>88</td><td>4</td><td>15</td><td>2</td><td>27</td><td>34</td><td>7</td><td>36</td><td>9</td></tr>

<tr><td>12</td><td>12</td><td>1</td><td>72</td><td>4</td><td>28</td><td>36</td><td>8</td><td>40</td><td>12</td></tr>

<tr><td>13</td><td>67</td><td>3</td><td>49</td><td>3</td><td>31</td><td>40</td><td>9</td><td>43</td><td>12</td></tr>

<tr><td>14</td><td>24</td><td>2</td><td>08</td><td>1</td><td>33</td><td>43</td><td>10</td><td>44</td><td>11</td></tr>

<tr><td>15</td><td>91</td><td>4</td><td>64</td><td>4</td><td>37</td><td>44</td><td>7</td><td>48</td><td>11</td></tr>

<tr><td colspan="7"><strong>Totals</strong></td><td><strong>63</strong></td><td></td><td><strong>107</strong></td></tr>

</table><span class="worked-note">Row 2: the digit 17 lies in 00-22, so this customer arrives 1 min after customer 1, at t = 4; but the librarian is busy until t = 5, so service starts at 5 and the customer waits 1 min. Follow the wait column down - 0, 1, 1, 2, 0, 2, 2, 3, 5, 6, 7, 8, 9, 10, 7 - it builds up and never recovers, the first sign that one librarian is not enough.</span></li>

<li><span class="worked-calc">Average waiting time:

W&#772; = &#931;W&#7522; / n = 63 / 15 = <strong>4.2 min</strong></span></li>

<li><span class="worked-calc">Average time in the system:

T&#772; = &#931;T&#7522; / n = 107 / 15 = <strong>7.13 min</strong>

Cross-check on the means: T&#772; = W&#772; + mean service time = 4.2 + 44/15 = 4.2 + 2.93 = 7.13 min &#10004;</span><span class="worked-note">Always cross-check with T&#772; = W&#772; + mean service time - if the two do not agree there is an arithmetic slip in the table.</span></li>

<li><span class="worked-calc">Probability that the librarian is busy.

Total busy time = &#931; service times = 2+3+3+1+4+3+2+4+3+5+2+4+3+1+4 = 44 min

Run length = t = 0 to the last departure at t = 48 = 48 min

P(busy) = 44 / 48 = 0.917 &#8776; <strong>91.7 %</strong></span><span class="worked-note">For a single server P(busy) is the utilisation, busy time / run length. The librarian is idle only for the first 3 min and for the 1 min between t = 12 and t = 13, so the sum of the service times must equal the busy span - a useful check.</span></li>

<li><span class="worked-calc"><strong>Step 3 - does one librarian cope?</strong> Replace each distribution by its mean; this is the route the class notes actually write out.

mean inter-arrival time A = 1(0.23) + 2(0.37) + 3(0.25) + 4(0.15) = <strong>2.32 min</strong> &#8594; &#955; = 1/2.32 = <strong>0.431 customers/min</strong>

mean service time S = 1(0.10) + 2(0.20) + 3(0.33) + 4(0.22) + 5(0.10) + 6(0.05) = <strong>3.17 min</strong>

&#961; = &#955;S = 0.431 &#215; 3.17 = <strong>1.366 &gt; 1</strong>, so arrivals are faster than one librarian can serve and the queue has no steady state.

Wq = &#955;S&#178; / 2(1 &#8722; &#955;S) = 4.331 / (2 &#215; &#8722;0.366) = <strong>&#8722;5.91 min</strong>

Ws = Wq + S = &#8722;5.91 + 3.17 = <strong>&#8722;2.74 min</strong>

P(server busy) = &#955;S = <strong>1.37</strong> - not a probability at all, because it exceeds 100 %</span><span class="worked-note">These are the notes' numbers, and the negative values are the message: they are what the waiting-time formulas produce once &#961; &gt; 1. Read them as "the system is overloaded", never as waiting times.</span></li>

</ol>

<p class="worked-result"><strong>Average waiting time 4.2 min&nbsp;·&nbsp;average time in system 7.13 min&nbsp;·&nbsp;P(librarian busy) = 91.7 %&nbsp;·&nbsp;mean-rate check &#961; = 1.37, so one librarian cannot cope</strong></p>

</div>

<div class="concept-box important">
<h4>The negative figures are the point, not a mistake</h4>
<p>&#961; = &#955;S = 1.37 means customers arrive faster than one librarian can serve them, so the queue has no steady state and no formula can hand out a waiting time. The negative Wq and the P(busy) of 1.37 are the arithmetic saying the model has run out of validity, and the trace above says the same thing: the waits climb 0 &#8594; 10 min and never come back down.</p>
<ul>
<li><strong>A probability can never exceed 1.</strong> Quote P(busy) = 1.37 as 'over 100 %, therefore the system is unstable', never as an answer.</li>
<li><strong>State which Wq formula you used.</strong> The notes' form &#955;S&#178; / 2(1 &#8722; &#955;S) gives &#8722;5.91 min; the M/M/1 form &#955; / [&#956;(&#956; &#8722; &#955;)] with &#956; = 1/3.17 = 0.315 gives &#8722;11.82 min. Both are negative, so writing the formula down is what tells the marker which one you intended.</li>
<li><strong>15 customers is too short a run to expose &#961; &gt; 1.</strong> The replication above averaged only a 4.2 min wait because its digit block happened to draw slower arrivals (mean 37/15 = 2.47 min against the expected 2.32) and shorter service (mean 44/15 = 2.93 min against 3.17). That is exactly why the mean-rate check is worth doing next to the trace.</li>
<li><strong>The design conclusion:</strong> a second librarian, or a faster counter, is needed. The simulation has answered the staffing question, not just produced averages.</li>
</ul>
</div>

<p><strong>Notes for a full-mark answer:</strong> show the interval table first (it is fixed by the distributions the question gives), then the recurrence, then the trace row by row, then the three measures with the arithmetic visible. State the queue discipline (FIFO) and that arrivals are served in order; state that the digits came from a random-number table and name it; and finish with the mean-rate check and the &#961; &gt; 1 warning. A real study would repeat the run many times and report each measure as a mean with a confidence interval, which is the subject of Chapter 7.</p>`}
]
};
