/* Chapter 3 — Synchronization and Coordination.

   Syllabus unit 3: 5 hours, 6 marks. Sub-topics 3.1 Clock Synchronization
   (Cristian's Algorithm, NTP), 3.2 Logical Clocks (Lamport's and Vector
   Clocks), 3.3 Mutual Exclusion Algorithms (Ricart-Agrawala, Token Ring),
   3.4 Election Algorithms (Bully, Ring).

   Written from Er. Avijit Karn's 94-slide Chapter 3 deck, read into
   `_source/dcc/lecture_notes_all_chapterwise_ch_3_sync_and_cordn.txt` by
   tools/dcc_extract.py. The deck is mostly pictures — 74 of its 94 slides
   carry text inside their images — so the extracted file contains both the
   text frames and the OCR of every slide picture. The Cristian's-algorithm
   arithmetic, the NTP offset derivation and the election walkthroughs below
   are read out of those recovered picture labels, not reconstructed.

   Three facts in the NTP section and in the comparison of the three named algorithms come from the reference text instead of the deck, and the prose is written so that a reader is not told where each one was
   read: the reference clock that no machine reads as a time server (Tanenbaum and
   Van Steen, the stratum-0 clock), the rule that a server takes time only from a
   better stratum (same text), and the comparison of the mutual-exclusion
   algorithms — three messages and two message times for the central coordinator,
   2(n - 1) for Ricart-Agrawala, 1 to n - 1 for the token ring (Tanenbaum's Note
   6.5, Figure 6.19).

   This unit is worth more in the exam than its 6 marks suggest: three
   questions of the Model Question 2025 come from it — Group A question 3,
   Group B question 8 and Group C question 14. */

window.CHAPTERS = window.CHAPTERS || {};
window.CHAPTERS[3] = {
  learn: `

<h2>Unit 3 &mdash; Synchronization and Coordination</h2>
<p class="unit-meta">Syllabus: 5 hours &middot; 6 marks &middot; sub-topics 3.1&ndash;3.4</p>

<p><strong>3.1 Clock synchronization</strong> asks whether two machines can agree on the time, and answers with Cristian's algorithm and NTP. It cannot succeed completely, which is the point: clocks drift, and no amount of synchronisation removes the drift. <strong>3.2 Logical clocks</strong> is the response to that failure &mdash; stop measuring time and start ordering events, with Lamport's counter and vector clocks. <strong>3.3 Mutual exclusion</strong> applies that ordering to the classic problem of one resource and many claimants, and compares the permission-based and token-based algorithm families. 3.4 Election algorithms asks who decides when the process that was deciding has failed.</p>

<p>Every algorithm here answers to the same four requirements &mdash; safety, liveness, fairness and, for mutual exclusion, the number of messages.</p>

<h2>3.0 Time in distributed systems</h2>
<p class="prereq-note">Outside the syllabus &mdash; the sub-topic list begins at 3.1. This is the ground the unit builds on.</p>

<p>There is no reliable global time in a distributed system, and most coordination problems follow from that. The example is concrete: we require computers around the world to timestamp electronic commerce transactions consistently. The harder requirement is being able to say, of a distributed execution, what happened when.</p>

<p>Three facts make this hard, and they are the whole motivation for the unit:</p>
<ul>
<li>Each computer has its own physical clock, so there is no single clock to read.</li>
<li><strong>The clocks typically deviate</strong>, and we cannot synchronize them perfectly.</li>
<li>The absence of global physical time makes it difficult to find the state of our distributed programs as they execute. We often need to know what state process A is in when process B is in a certain state, but we cannot rely on physical clocks to tell us what is true <em>at the same time</em>.</li>
</ul>

<h3>How a computer timer actually works</h3>
<p>A computer timer is a counter register and a holding register. The counter is decremented by a <strong>quartz crystal oscillator</strong>; when it reaches zero, an interrupt is generated and the counter is reloaded from the holding register &mdash; for example 60 times per second. Each interrupt is called a clock tick.</p>

<p>A <strong>physical clock</strong> is therefore an electronic device that counts oscillations in a crystal at a definite frequency, typically divides the count, and stores the result in a counter register. Two further definitions follow from it:</p>
<ul>
<li><strong>Drift rate</strong> is the rate at which a clock deviates from real time. Clocks gain or lose time at different rates, and hence need to be synchronized; the drift rate is also how you determine <em>how often</em> they should be synchronized.</li>
<li>A <strong>synchronized</strong> clock is one whose value must not deviate from real time by more than a certain amount &mdash; and when that additional constraint is added, physical clocks must be the same, which is the harder requirement.</li>
</ul>
<div class="concept-box key">
<h4>Six jobs that need the clocks to agree</h4>
<p>Six separate jobs depend on the machines agreeing what time it is:</p>
<ul>
<li><strong>Precise performance measurements</strong> &mdash; a duration is only measurable when both of its ends are stamped by clocks that agree.</li>
<li>Guaranteeing up-to-date or recent data &mdash; a cache entry, a replica or a lease is valid only for a period, and the period is measured in time.</li>
<li>Temporal ordering of events produced by concurrent processes.</li>
<li>Synchronization between senders and receivers of messages.</li>
<li>Coordination of joint activities.</li>
<li>Serialization of concurrent accesses to shared objects.</li>
</ul>
</div>

<h3>What unsynchronized clocks break &mdash; the <code>make</code> example</h3>
<div class="example-box">
<h4>Example: The Unix <code>make</code> Problem</h4>
<p>The classic failure is in Unix, where the <strong><code>make</code></strong> command is used to compile new or modified code without recompiling unchanged code. <code>make</code> uses the clock of the machine it runs on to determine which source files need to be recompiled. If the sources reside on a separate file server and the two machines have unsynchronized clocks, the <code>make</code> program might not produce the correct results. It may decide an output is newer than the source that produced it and skip a rebuild that was needed.</p>

<p>The general statement of the failure: when each machine has its own clock, an event that occurred after another event may nevertheless be assigned an earlier time. That is not a performance problem; it is a correctness problem, and the compiler/editor timeline shows exactly one such inversion: the object file created on one machine carries a timestamp that places it <em>before</em> the source edit that caused it.</p>
</div>

<h3>Event ordering and the happened-before relation</h3>
<p>Since there is no common memory and no common clock, it is sometimes impossible to say which of two events occurred first. The answer is not to measure time better but to define order without it. The <strong>happened-before relation</strong> (<code>&rarr;</code>) is a <strong>partial ordering of events</strong> defined by three rules:</p>
<ol>
<li>If A and B are events in the same process, and A was executed before B, then A &rarr; B.</li>
<li>If A is the event of sending a message by one process and B is the event of receiving that message by another process, then A &rarr; B.</li>
<li>If A &rarr; B and B &rarr; C, then A &rarr; C (transitivity).</li>
</ol>
<p>If two events A and B are not related by &rarr;, they are <strong>executed concurrently</strong> &mdash; that is, there is no causal relationship between them. To obtain a global ordering of all events, each event is timestamped so that for every pair of events A and B, if A &rarr; B then the timestamp of A is less than the timestamp of B.</p>

<div class="concept-box warn">
<h4>The requirement, and its limit</h4>
<p>The requirement is one-directional: <em>if A happened before B, then ts(A) &lt; ts(B)</em>. The converse need not be true. A timestamp order does not prove a causal order, and every limitation in 3.2 follows from that gap.</p>
</div>

<h3>Causal ordering of messages</h3>
<p>The first place event ordering has a practical cost: if M1 is sent before M2, then every recipient of both messages must get M1 before M2 &mdash; and the underlying network will not necessarily give this guarantee. Consider a replicated database system: updates to the entries should be received <em>in order</em>, or replicas diverge. The basic idea is to buffer a later message until the earlier one it causally depends on has been delivered. Vector clocks are the mechanism that makes "later" decidable.</p>

<p>The order messages are <em>sent</em> in is not the order they are <em>received</em> in, and nothing in the network promises otherwise: two messages can take different routes, and a later one can overtake an earlier one. Causal ordering adds the guarantee that matters &mdash; not one global order everyone agrees on, but that an effect is never seen before its cause. All the work sits in the buffering rule: a process that receives a message whose causal predecessor it has not yet seen has to hold it, which means it needs a way to decide whether one message depends on another. Lamport timestamps cannot make that decision — they order everything and prove nothing about concurrency — and vector clocks can.</p>

<h2>3.1 Clock Synchronization: Cristian's Algorithm, NTP</h2>

<p>Clock synchronization splits into two families:</p>

<table class="comparison-table">
<thead>
<tr><th>Family</th><th>Algorithms</th><th>What is synchronized</th></tr>
</thead>
<tbody>
<tr><td><strong>Physical clock synchronization</strong></td><td><strong>Cristian's algorithm</strong> <span class="muted">centralized</span> &bull; NTP <span class="muted">distributed</span></td><td>The clocks themselves are moved toward real time (UTC).</td></tr>
<tr><td><strong>Logical clock synchronization</strong></td><td><strong>Lamport timestamps</strong> &bull; Vector clocks</td><td>Nothing physical: a counter captures causal order numerically.</td></tr>
</tbody>
</table>
<div class="concept-box tip">
<h4>The one-line answer</h4>
<p>Two pairs cover it: Cristian's algorithm and the Network Time Protocol for physical clocks. For logical clocks the pair is Lamport timestamps and vector clocks.</p>
</div>
<h3>Cristian's algorithm</h3>
<p>Cristian's algorithm relies on the existence of a time server. The time server maintains its clock using a radio clock or other accurate time source, and all other computers in the system stay synchronized with it. A time client maintains its clock by making a procedure call to the time server.</p>

<p>The procedure is three steps. Let P be a process and S a time server connected to a source of <strong>UTC</strong> (Coordinated Universal Time):</p>
<ol>
<li>P requests the time from S.</li>
<li>After receiving the request, S prepares a response and appends the time T from its own clock.</li>
<li>P then sets its time using:
<div class="formula-box">
<span class="fb-label">Cristian's Formula</span>
T<sub>new</sub> = T + RTT / 2
</div>
where RTT is the round-trip time of the request it made.</li>
</ol>

<figure class="figure-wide figure-wrap">
<svg class="figure wide" viewBox="0 0 760 300" role="img" aria-label="Cristian's algorithm timeline: the client sends a request at its time T0, the server timestamps its reply with T, the client receives the reply at T1, and sets its clock to T plus half the round trip time">
<defs><marker id="f3a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="flow-arrow-head"/></marker></defs>

<text class="flow-label" x="90" y="26" text-anchor="middle">Client P</text>
<text class="flow-label" x="640" y="26" text-anchor="middle">Time server S (UTC)</text>
<path class="flow-arrow" d="M90,40 V258"/>
<path class="flow-arrow" d="M640,40 V258"/>

<circle class="flow-dot" cx="90" cy="72" r="4"/>
<text class="flow-label" x="46" y="77">T0</text>
<path class="flow-arrow" d="M96,72 H634" marker-end="url(#f3a)"/>
<text class="flow-label" x="360" y="64" text-anchor="middle">request</text>

<circle class="flow-dot" cx="640" cy="120" r="4"/>
<text class="flow-label" x="656" y="125">T (server clock)</text>
<circle class="flow-dot" cx="640" cy="176" r="4"/>
<text class="flow-label" x="656" y="181">S prepares reply</text>
<path class="flow-arrow" d="M634,176 H96" marker-end="url(#f3a)"/>
<text class="flow-label" x="360" y="168" text-anchor="middle">reply with T appended</text>

<circle class="flow-dot" cx="90" cy="228" r="4"/>
<text class="flow-label" x="46" y="233">T1</text>
<text class="flow-label" x="360" y="250" text-anchor="middle">RTT = T1 &minus; T0 &nbsp;&middot;&nbsp; one-way delay estimated as RTT/2 &nbsp;&middot;&nbsp; P sets its clock to T + RTT/2</text>
<text class="flow-label" x="360" y="272" text-anchor="middle">assumes the round trip is split equally between request and response</text>
</svg>
<figcaption>Fig 3.1 &mdash; Cristian's algorithm. Both T0 and T1 are measured with the <em>same</em> clock, which is the whole trick: the client never needs the server's clock to be readable, only a timestamp and its own elapsed time. <code>(T1 &minus; T0)</code> is the Round Trip Time, and the interrupt-handling time is a third quantity to be subtracted.</figcaption>
</figure>

<div class="worked">
<div class="worked-head"><h4>Cristian's Algorithm</h4></div>
<p>The client sends its request at 5:08:15.100 (T0) and receives the response at 5:08:15.900 (T1). The response contains 5:09:25.300 (Tserver).</p>
<ol class="worked-steps">
<li>Calculate Round-trip time
<div class="worked-calc">RTT = T1 &minus; T0 = 5:08:15.900 &minus; 5:08:15.100 = 800 ms</div>
</li>
<li>Calculate local time
<div class="worked-calc">T<sub>new</sub> = T<sub>server</sub> + RTT / 2 = 5:09:25.300 + 400 = 5:09:25.700</div>
<p class="worked-note">Best guess: the timestamp was generated 400 ms ago.</p>
</li>
</ol>
<div class="worked-result">
<span>Accuracy</span>
<b>&plusmn; RTT/2</b>
</div>
</div>

<h3>How accurate is Cristian's algorithm, exactly?</h3>
<p>The method assumes the RTT is split equally between request and response, "which may not always be the case but is a reasonable assumption on a LAN connection". Accuracy can be improved by making multiple requests to S and using the response with the shortest RTT.</p>

<p>Let <strong>min</strong> be the minimum time to transmit a message one-way. Then the earliest point at which S could have placed the time T was min after P sent its request. Therefore the time at S, when the message is received by P, lies in the range (T + min) to (T + RTT &minus; min). The width of that range is (RTT &minus; 2&middot;min), which gives an accuracy of (RTT/2 &minus; min).</p>

<div class="concept-box warn">
<h4>Two practical constraints</h4>
<p>First, the time server needs to change its time gradually &mdash; a large jump forward or backward would confuse every timer and measurement running on the client, so a correction is applied by slewing the clock rather than setting it. Second, while responding to a client the server <strong>must consider message delays</strong>, which is what the RTT correction in the formula is doing. A third constraint is easy to miss: the client's <strong>interrupt handling time</strong> is part of the measurement, which is why the corrected forms of the formula subtract it.</p>
</div>

<h3>Network Time Protocol (NTP)</h3>
<p>NTP is the most commonly used Internet time protocol and the one that provides the best accuracy (RFC 1305). The operational facts:</p>
<ul>
<li>Computers often include NTP software in the OS. The client software periodically gets updates from one or more servers and averages them.</li>
<li>Time servers listen to NTP requests on port 123, and reply with a UDP/IP data packet in NTP format, which is a 64-bit timestamp in UTC seconds since 1 Jan 1900, with a resolution of 200 picoseconds.</li>
<li>Many PC clients get time from a single server with no averaging; this simple version is called <strong>SNTP</strong> (Simple Network Time Protocol, RFC 2030).</li>
</ul>

<p>Servers are arranged in a <strong>synchronization subnet</strong> of strata, and the level a server occupies says how far its clock is from a real time source:</p>
<ul>
<li><strong>Stratum 0</strong> &mdash; the reference clock itself: an atomic clock or a GPS receiver, which no ordinary machine reads as a time server.</li>
<li><strong>Stratum 1</strong> &mdash; the machines connected directly to such a source.</li>
<li><strong>Stratum 2</strong> &mdash; machines synchronized from stratum-1 servers, which is the layer an ordinary client talks to.</li>
<li><strong>Stratum 3</strong> and below &mdash; each further level takes its time from the one above it, so the errors of every level above accumulate in it.</li>
</ul>
<p>A server adjusts its own clock only if its stratum level is higher &mdash; further from the source &mdash; than that of the peer it is talking to, and after synchronizing it becomes one stratum below that peer. That is what keeps the subnet a hierarchy rather than a loop, and why a machine never accepts time from a worse source than itself. A client's distance from the source is therefore <em>how many strata away</em> it is, and the diagram shows stratum 1 at the top with stratum 2 and stratum 3 layered beneath it.</p>
<!-- dcc-fig:ch3/ch-3-sync-and-cordn-s20-044.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch3/ch-3-sync-and-cordn-s20-044.webp" alt="The NTP synchronization subnet: stratum 1 machines are connected directly to an accurate time source, and each stratum below is synchronized from the one above it." width="593" height="244" loading="lazy" decoding="async">
<figcaption>The NTP synchronization subnet: stratum 1 machines are connected directly to an accurate time source, and each stratum below is synchronized from the one above it.</figcaption>
</figure>
<!-- /dcc-fig -->
<h3>NTP goals and synchronization modes</h3>
<table class="comparison-table">
<thead>
<tr><th>NTP goals</th><th>How each is met</th></tr>
</thead>
<tbody>
<tr><td>Enable clients across the Internet to be accurately synchronized to UTC despite message delays</td><td>The offset calculation, which removes the asymmetry of the round trip.</td></tr>
<tr><td>Use statistical techniques to filter data and improve quality of results</td><td>Averaging updates from several servers; the SNTP client that skips this is explicitly the less accurate one.</td></tr>
<tr><td>Provide reliable service, and survive lengthy losses of connectivity</td><td>Redundant paths and redundant servers.</td></tr>
<tr><td>Enable clients to synchronize frequently</td><td>Periodic polling, with adjustment of clocks by using the offset (in symmetric mode).</td></tr>
<tr><td>Provide protection against interference</td><td>Authenticate the source of data.</td></tr>
</tbody>
</table>

<table class="comparison-table">
<thead>
<tr><th>NTP mode</th><th>Accuracy</th><th>How it works</th></tr>
</thead>
<tbody>
<tr><td><strong>Multicast</strong></td><td>Low accuracy, for quick LANs</td><td>The server periodically multicasts its time to its clients in the subnet.</td></tr>
<tr><td><strong>Remote Procedure Call</strong></td><td>Medium accuracy</td><td>The server responds to client requests with its actual timestamp &mdash; like Cristian's algorithm.</td></tr>
<tr><td><strong>Symmetric mode</strong></td><td>High accuracy</td><td>Used to synchronize <strong>between the time servers</strong>, peer to peer.</td></tr>
</tbody>
</table>
<p>In all three, messages are delivered unreliably with UDP &mdash; which is why the protocol needs many rounds and statistical filtering rather than one careful exchange.</p>

<h3>The NTP offset derivation</h3>
<p>Four timestamps are involved: Client A and server B:</p>
<ul>
<li><strong>T1</strong> &mdash; A sends its request at this time (A's clock).</li>
<li><strong>T2</strong> &mdash; B receives the request at this time (B's clock).</li>
<li><strong>T3</strong> &mdash; B responds at this time, sending the values of T2 and T3 (B's clock).</li>
<li><strong>T4</strong> &mdash; A receives the response (A's clock).</li>
</ul>
<p>The question is &theta; = TB &minus; TA: by how much do the two clocks differ? Two assumptions make it answerable: the transit time is approximately the same in both directions, and B is the server A wants to synchronize to.</p>
<ol>
<li>A knows (T4 &minus; T1) from its own clock.</li>
<li>B reports T3 and T2 in its response.</li>
<li>A therefore computes the total transit time of both messages as (T4 &minus; T1) &minus; (T3 &minus; T2) &mdash; the elapsed time minus the time B spent working on it.</li>
<li>One-way transit time is approximately half of that, so B's clock at T4 reads approximately [(T4 &minus; T1) + (T2 + T3)] / 2.</li>
<li>The difference between the B and A clocks at T4 is therefore:
<div class="formula-box">
<span class="fb-label">NTP Offset Formula</span>
&theta; = [(T2 &minus; T1) + (T3 &minus; T4)] / 2
</div>
</li>
</ol>

<div class="concept-box key">
<h4>Why step 3 subtracts</h4>
<p>Step 3 is where the subtraction does the work: (T4 &minus; T1) is the whole journey as measured by one clock, and (T3 &minus; T2) is the part of it that was the server thinking, not travelling. Subtracting the second from the first leaves the time actually spent on the wire. Without that subtraction you are measuring the server's processing time as if it were network delay &mdash; which is exactly the error Cristian's algorithm accepts and NTP removes.</p>
</div>

<h3>The Berkeley algorithm &mdash; when no machine has a UTC receiver</h3>
<p class="prereq-note">Outside the syllabus &mdash; 3.1 names Cristian's algorithm and NTP. The Berkeley algorithm is the third of the classical three, background rather than a named sub-topic, and the election section reuses it as the example of a coordinator.</p>
<p>Cristian's algorithm and NTP both assume that somebody holds real time and everybody else takes it from them. The Berkeley algorithm drops that assumption. Its server is <em>active</em> rather than passive: a time daemon polls every machine from time to time and asks what time it is there, where a passive server waits to be asked. Nothing in the exchange refers to real time, so what the machines share is an agreed time rather than a correct one. That is why it is an internal clock synchronization algorithm, suited to a system in which no machine has a UTC receiver.</p>
<ol>
<li>The time daemon asks every other machine for its clock value.</li>
<li>Each machine answers with how far ahead of or behind the daemon its own clock is.</li>
<li>The daemon computes the average of those answers and takes it as the new reference value for the group.</li>
<li>The daemon tells each machine whether to <em>advance</em> its clock to the new time or to <em>slow it down</em> until the difference has been taken out &mdash; a correction spread over time, so that no clock jumps and no measurement already running is broken.</li>
</ol>
<div class="concept-box key">
<h4>What the Berkeley algorithm costs</h4>
<p>The agreed time is only as good as the daemon's own clock, which an operator has to set from time to time, and the scheme needs one machine to act as the daemon at all. That second point is why the algorithm reappears in 3.4: the daemon is chosen by an election, so when it fails a new one has to be elected to take over the averaging.</p>
</div>

<h2>3.2 Logical Clocks: Lamport's and Vector Clocks</h2>

<p>The goal of physical synchronization comes first: the goal of clock synchronization is to minimize the difference between the accepted actual time and the time on a given client machine. When that is achieved, the clocks in the set are "more closely in sync". But even with more accurate clocks corrected more often, developers of distributed systems should still be wary of relying on local clock time, because:</p>
<ul>
<li>There are corrections going on, so the time recorded for an event may have happened at a different time on another computer, because of differing drift rates of those computer timers.</li>
<li>Correcting time does not mean all machines agree on time &mdash; it means they are much closer to each other on average. For some distributed systems that may be sufficient; for others it may not.</li>
</ul>

<h3>Logical clocks &mdash; the idea</h3>
<p>Invented by <strong>Lamport (1978)</strong>, a logical clock is a simple mechanism by which the happened-before ordering can be captured numerically. Precisely:</p>
<ul>
<li>It is a <strong>monotonically increasing software counter</strong>, whose value need bear no particular relationship to any physical clock.</li>
<li>Each process <code>pi</code> keeps its own logical clock <code>Li</code>, which it uses to apply so-called <strong>Lamport timestamps</strong> to events.</li>
<li>It provides <strong>consistent event ordering</strong>.</li>
</ul>
<p>The illustration of the difference: it is adequate that all machines agree that it is 10:00 even if it is really 10:02. The clocks only have to be <strong>internally consistent</strong>; they need not be close to real time.</p>

<p>Architecturally, logical clocks live in the middleware layer: the application sends a message, and the middleware adjusts the local clock and timestamps the message before the network layer carries it; on receipt the middleware delivers it to the application after the clock has been updated. The application never manipulates a logical clock directly &mdash; which is why the mechanism can be added to an existing system without changing its programs.</p>
<h3>Lamport's algorithm</h3>
<p>A Lamport logical clock is an incrementing software counter maintained in each process. The algorithm has three rules:</p>
<div class="formula-box lines">
<span class="fb-label">Lamport's Algorithm Rules</span>
Rule 1: A process increments its counter before each event in that process.
Rule 2: When a process sends a message, it includes its counter value with the message.
Rule 3: On receiving a message, the receiver sets its counter to be greater than the maximum of its own value and the received value, before it considers the message received.
</div>
<p>Conceptually, the logical clock can be thought of as a clock that only has meaning in relation to messages moving between processes: when a process receives a message, it resynchronizes its logical clock with that sender.</p>

<p>The three rules are one rule about messages: a counter is only ever pushed forward by <em>sending</em> or by <em>receiving</em>, so the value a process holds is a summary of everything it has heard about. Rule 3 takes a <strong>maximum</strong> rather than a simple increment because the receiver may already have done work of its own that the sender knows nothing about. Taking the larger value is what keeps the causal direction consistent. The result is a <strong>total order</strong> over the events of the whole system &mdash; every event gets a number and no two events tie. That is enough for the classic use: putting concurrent requests for the same resource into one agreed order, which is exactly what the mutual-exclusion algorithms of 3.3 are built on. It is not enough in the reverse direction, and that asymmetry is the limitation. A smaller timestamp does not imply that the event happened first. Two concurrent events can be numbered 3 and 7 with no causal relation between them, so Lamport timestamps can put an order on two updates that never saw each other &mdash; a false positive. Vector clocks exist to remove it.</p>

<figure class="figure-wide figure-wrap">
<svg class="figure wide" viewBox="0 0 780 330" role="img" aria-label="Lamport timestamps on three processes: each process increments its counter at each event, and a message carries the sender's counter so the receiver jumps to one more than the maximum of its own value and the received value">
<defs><marker id="f3b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="flow-arrow-head"/></marker></defs>

<text class="flow-label" x="70" y="24" text-anchor="middle">p1</text>
<text class="flow-label" x="390" y="24" text-anchor="middle">p2</text>
<text class="flow-label" x="700" y="24" text-anchor="middle">p3</text>
<path class="flow-arrow" d="M70,34 V300"/>
<path class="flow-arrow" d="M390,34 V300"/>
<path class="flow-arrow" d="M700,34 V300"/>

<circle class="flow-dot" cx="70" cy="60" r="4"/><text class="flow-label" x="34" y="65">1</text>
<circle class="flow-dot" cx="70" cy="130" r="4"/><text class="flow-label" x="34" y="135">2</text>
<circle class="flow-dot" cx="70" cy="250" r="4"/><text class="flow-label" x="34" y="255">4</text>

<circle class="flow-dot" cx="390" cy="90" r="4"/><text class="flow-label" x="354" y="95">1</text>
<circle class="flow-dot" cx="390" cy="180" r="4"/><text class="flow-label" x="354" y="185">2</text>
<circle class="flow-dot" cx="390" cy="265" r="4"/><text class="flow-label" x="354" y="270">5</text>

<circle class="flow-dot" cx="700" cy="140" r="4"/><text class="flow-label" x="664" y="145">1</text>
<circle class="flow-dot" cx="700" cy="220" r="4"/><text class="flow-label" x="664" y="225">2</text>

<path class="flow-arrow" d="M74,132 L386,182" marker-end="url(#f3b)"/>
<text class="flow-label" x="228" y="146" text-anchor="middle">m carries 2</text>
<path class="flow-arrow" d="M394,182 L696,142" marker-end="url(#f3b)"/>
<text class="flow-label" x="548" y="152" text-anchor="middle">m carries 2</text>
<path class="flow-arrow" d="M696,222 L394,267" marker-end="url(#f3b)"/>
<text class="flow-label" x="548" y="250" text-anchor="middle">m carries 2</text>
<path class="flow-arrow" d="M386,267 L74,252" marker-end="url(#f3b)"/>
<text class="flow-label" x="228" y="282" text-anchor="middle">m carries 5</text>

<text class="flow-label" x="390" y="318" text-anchor="middle">on receipt the counter becomes one more than max(own, received) &mdash; which is why p2 jumps 2 &rarr; 3 on the message from p1</text>
</svg>
<figcaption>Fig 3.2 &mdash; Lamport timestamps and the happened-before relation. Every counter value along a process increases, and a message always carries a value lower than the receive event that follows it &mdash; so rule 2 of happened-before is respected numerically. The ordering is <em>one-directional</em>: two concurrent events can carry 3 and 7 with no causal link between them, which is the anomaly vector clocks fix.</figcaption>
</figure>

<h3>Lamport's considerations, and the limitation</h3>
<p>Two implementation details must hold for the timestamps to be usable:</p>
<ul>
<li>For any two events <em>a</em> and <em>b</em> in the same process, with <code>C(x)</code> the timestamp of event <em>x</em>, it is necessary that <strong><code>C(a)</code> never equals <code>C(b)</code></strong>. So the logical clock must be set so that there is at least one clock tick (one increment) between events.</li>
<li>In a multiprocessor or multithreaded environment it may be necessary to attach the process ID or another unique ID to the timestamp, so that events that occur simultaneously in different processes can be told apart.</li>
</ul>

<p>Two further statements matter here. A distributed system is said to have <strong>partial order</strong> if a partial-order relationship exists among the events; if <strong>totality</strong> &mdash; a causal relationship among <em>all</em> events &mdash; can be established, the system has total order. And on update ordering in replicated systems: the problem is how to ensure all sites recognize a fixed order on updates even when updates are delivered out of order. The solution is to assign timestamps to updates at their accepting site and order them by source timestamp at the receiver, giving nodes unique IDs and breaking ties with the origin node ID. Comparing <em>physical</em> timestamps for this is arbitrary, because physical clocks drift &mdash; and even loosely synchronized physical clocks cannot order events that occurred at almost exactly the same time.</p>

<table class="comparison-table">
<thead>
<tr><th>What Lamport's clocks <em>do</em></th><th>What they do not do</th></tr>
</thead>
<tbody>
<tr><td>a &rarr; b implies ts(a) &lt; ts(b). Every event in the system can be totally ordered by timestamp, consistently with causality.</td><td>ts(a) &lt; ts(b) does <em>not</em> imply a &rarr; b. Nothing can be said about the actual real time of A and B; a logical order is not a real-time order. The problem is that the clocks do not capture causality violations.</td></tr>
<tr><td>Gives a total order, which is enough for many purposes (for example, deciding which of two updates is "later").</td><td>If we know that A &rarr; C and B &rarr; C, we cannot say which of A or B initiated C. Why that matters: when recovering after a crash, knowing the causal relationships between messages lets you replay them in an order that respects causality, and get the node back to the state it needs to be in.</td></tr>
</tbody>
</table>

<h3>Vector clocks</h3>
<p>Vector clocks exist precisely because of that gap. The formal statement: a vector clock is an algorithm for generating a partial ordering of events in a distributed system and detecting causality violations. As with Lamport timestamps, inter-process messages contain the state of the sending process's logical clock &mdash; but the state is now a vector.</p>

<ul>
<li>A vector clock of a system of N processes is an array (vector) of N logical clocks, one clock per process. A local "smallest possible values" copy of the global clock array is kept in each process.</li>
<li>The purpose is a more detailed representation of what a site might know.</li>
</ul>

<p>The rules:</p>
<div class="formula-box lines">
<span class="fb-label">Vector Clock Rules</span>
Rule 1: In a system with N nodes, each site keeps a vector timestamp <code>TS[N]</code> as well as a logical clock LC. <code>TS[i]</code> at site <em>i</em> is the most recent value of site <em>j</em>'s logical clock that site <em>i</em> has <strong>heard about</strong>, and each site keeps its own LC in <code>TS[i]</code>.
Rule 2: When site <em>i</em> generates a new event, it increments its logical clock.
Rule 3: When site <em>r</em> observes an event (for example, receives a message) from site <em>s</em>, it sets its TS<sub>r</sub> to the pairwise maximum of TS<sub>r</sub> and TS<sub>s</sub>: for each site <em>i</em>, <code>TSr[i] = max(TSr[i], TSs[i])</code>.
</div>
<p>The simplified version is sufficient:</p>
<ul>
<li>Initially all clocks are zero.</li>
<li>Each time a process experiences an <strong>internal event</strong>, it increments its own logical clock in the vector by one.</li>
<li>Each time a process prepares to send a message, it increments its own clock in the vector by one and then sends its entire vector along with the message.</li>
<li>Each time a process <strong>receives a message</strong>, it increments its own clock by one and updates each element in its vector by taking the maximum of the value in its own vector and the value in the received vector, for every element.</li>
</ul>
<div class="concept-box key">
<h4>Why vector clocks are "necessary and sufficient"</h4>
<p>The argument runs: logical clocks induce an order consistent with causality, but the converse of the clock condition does not hold. It may be that <code>LC(e1) &lt; LC(e2)</code> even when e1 and e2 are concurrent, so a larger value can accompany an event that is not the later one. These are <strong>false positives</strong>, and the consequence is that concurrent updates may be ordered unnecessarily. A vector clock is the mechanism that is necessary and sufficient for capturing causality. Two events are causally related exactly when one vector dominates the other element-by-element, and events whose vectors do <em>not</em> dominate each other are provably concurrent. That is how a replicated store detects a genuine conflict (two updates to the same item, neither timestamp dominating the other) instead of inventing an arbitrary winner.</p>
</div>
<h3>Causal ordering of messages using vector clocks</h3>
<p>Vector clocks pay for themselves here. <strong>Causal ordering of messages</strong> means maintaining the same causal order of message receive events as of message send events: if <code>Send(M1) &rarr; Send(M2)</code> and <code>Receive(M1)</code> and <code>Receive(M2)</code> are on the same process, then <code>Receive(M1) &rarr; Receive(M2)</code>. It is useful, for example, for replicated databases.</p>
<p>Two algorithms are named:</p>
<ul>
<li><strong>Birman&ndash;Schiper&ndash;Stephenson (BSS)</strong> causal ordering of <em>broadcasts</em>.</li>
<li><strong>Schiper&ndash;Eggli&ndash;Sandoz (SES)</strong> causal ordering of <em>regular messages</em>.</li>
</ul>
<p>The basic idea of both is the same: use the vector clock to delay out-of-order message delivery until the messages it depends on have been delivered.</p>

<p>Vector clocks become unavoidable as soon as a message is delayed: a process must be able to tell whether it is <em>later</em> than one it is still waiting for. Lamport timestamps cannot answer that question &mdash; they will order two events that may be concurrent (the false positive). A vector timestamp can. Message M1 causally precedes M2 exactly when M1's vector is dominated by M2's, so the receiver of M2 knows precisely which earlier messages must have arrived first, and holds M2 until they have. The two named algorithms differ only in what they are applied to: <strong>BSS</strong> orders <em>broadcasts</em>, where every process is a recipient of every message and one extra vector per message is therefore enough. <strong>SES</strong> orders <em>ordinary point-to-point messages</em>, where a process cannot know what a peer has already seen and each message must carry more state to compensate. The application makes it concrete: a replicated database, where applying two updates in different orders on different replicas leaves the copies permanently different.</p>

<h2>3.3 Mutual Exclusion Algorithms (Ricart-Agrawala, Token Ring)</h2>

<h3>Background</h3>
<p>Three communication scenarios come first, because mutual exclusion is not always needed:</p>
<ul>
<li><strong>One-way communication</strong> usually does <em>not</em> need mutual exclusion.</li>
<li><strong>Client/server communication</strong> is multiple clients making service requests to a shared server. If coordination is required among the clients it is <strong>handled by the server</strong>, and there is no explicit interaction among client processes &mdash; and hence no need for mutual exclusion.</li>
<li><strong>Inter-process communication</strong>, where processes must exchange information to reach a conclusion about the system or an agreement among cooperating processes, is where it is needed.</li>
</ul>

<p>The terms are the shared-memory ones, extended to a distributed setting:</p>
<table class="comparison-table">
<thead>
<tr><th>Term</th><th>Definition</th></tr>
</thead>
<tbody>
<tr><td><strong>Critical section (region)</strong></td><td>A section of code or region in which a process or thread competes in a potentially destructive way with another process or thread for access to a shared data item or file.</td></tr>
<tr><td><strong>Race condition</strong></td><td>A problem caused by accessing the critical section from two or more processes at the same time.</td></tr>
<tr><td><strong>Mutual exclusion</strong></td><td>The solution to the race condition. If two processes are allowed to be concurrently in competing critical sections, incorrect results may be computed; ensuring this destructive interaction does not occur is mutual exclusion.</td></tr>
</tbody>
</table>

<h3>The four requirements</h3>
<p>These are the shared-memory requirements, but they apply unchanged:</p>
<ol>
<li><strong>Safety</strong> &mdash; at most one process in the critical section.</li>
<li><strong>Liveness</strong> &mdash; if more than one process is requesting, someone enters.</li>
<li><strong>No starvation</strong> &mdash; a requesting process enters within a finite time.</li>
<li><strong>Fairness</strong> &mdash; requests are granted in order.</li>
</ol>
<p>The four divide into two kinds. <strong>Safety</strong> says what must never happen, and it is enforced by the protocol's own rules. The other three are claims about progress, and progress is what a bad protocol breaks first &mdash; a scheme in which one process holds the right forever is perfectly safe and completely useless. Fairness is the strongest of the three, because granting requests in order implies no starvation, which implies liveness. Each of the algorithms — the central coordinator, Lamport's and Ricart–Agrawala's permission schemes and the token ring — satisfies the four requirements at a cost, and that cost is almost always a message count.</p>
<h3>The two approaches and the algorithm families</h3>
<table class="comparison-table">
<thead>
<tr><th>Approach</th><th>How the right is granted</th><th>Algorithms</th></tr>
</thead>
<tbody>
<tr><td><strong>Non-token-based</strong> (permission-based)</td><td>Each process freely and equally competes for the right to use the shared resource; requests are arbitrated either by a central control site or by distributed agreement.</td><td>Permission from a <strong>central coordinator</strong>: central coordinator based algorithm. Permission from all distributed processes: Lamport's algorithm, Ricart&ndash;Agrawala algorithm.</td></tr>
<tr><td><strong>Token-based</strong></td><td>A <strong>logical token</strong> representing the access right is passed in a regulated fashion among the processes; whoever holds the token is allowed to enter the critical section.</td><td>Token Ring algorithm, Suzuki&ndash;Kasami, Raymond, Singhal and others.</td></tr>
</tbody>
</table>

<p>The two families answer one question &mdash; who may enter? &mdash; with opposite default answers, and the rest follows. Permission-based algorithms say <em>ask first</em>: nothing happens until enough peers agree, so a request costs messages and a failure usually costs a wait, but no process can enter by accident, and correctness is easy to argue. Token-based algorithms say <em>hold and use</em>: the right to enter is an object, and whoever holds it is already entitled to enter, so entering costs nothing at all and the design problem moves wholesale to the token. Two questions follow: how to find it when it is lost or its holder dies (which is an election, 3.4), and how to keep it circulating so that nobody waits for a full lap of the ring. That is the trade: <strong>message cost per entry</strong> against a single object whose loss stops everything.</p>

<h3>Ricart&ndash;Agrawala &mdash; the syllabus's named non-token algorithm</h3>
<p>Ricart&ndash;Agrawala is <strong>an improvement over Lamport's</strong> algorithm, and the kernel of the improvement is precise: node j need not send a REPLY to node i if j has a request with a timestamp lower than the request of i. In that case i cannot enter before j anyway. The messages that would have been sent to convey a decision that the timestamp already determines are simply not sent.</p>

<p>Its properties, as listed:</p>
<ul>
<li><strong>Does not require FIFO</strong> channels &mdash; ordering is carried in the timestamps, not the transport.</li>
<li>2(n &minus; 1) messages per critical-section invocation &mdash; a request to every other node, and a reply from every other node.</li>
<li>Synchronization delay = maximum message transmission time.</li>
<li>Requests are granted in order of increasing timestamps.</li>
</ul>
<p>The algorithm itself:</p>
<div class="worked">
<div class="worked-head"><h4>Ricart&ndash;Agrawala Algorithm</h4></div>
<ol class="worked-steps">
<li>Requesting the critical section
<p class="worked-note">Send a timestamped REQUEST message <code>(tsi, i)</code>.</p>
</li>
<li>Receiving a request <code>(tsi, i)</code> at j
<p class="worked-note">Send REPLY to i if j is neither requesting nor executing; if j is requesting, and i's request timestamp is smaller than j's request timestamp, also send REPLY; otherwise, defer the request.</p>
</li>
<li>Entering the critical section
<p class="worked-note">i enters the critical section on receiving REPLY from all nodes &mdash; and then sends REPLY to all deferred requests, which is what releases the nodes that were waiting behind it.</p>
</li>
</ol>
</div>
<div class="concept-box tip">
<h4>Why the reply can be omitted</h4>
<p>Ricart&ndash;Agrawala is a distributed vote in which the vote can be inferred rather than sent. Since every node orders requests by timestamp, a node that is itself waiting with an earlier timestamp does not need to reply at all, because its own request already tells the requester to wait. That is where the message saving over a plain "ask everyone, wait for everyone" scheme comes from.</p>
</div>

<h3>Token-based algorithms and the Token Ring</h3>
<p>The token-based family shares one property: a single token circulates, and a process enters the critical section when it holds the token, so mutual exclusion is obvious by construction. The algorithms in the family differ in how a process finds and gets the token, and they use sequence numbers rather than timestamps to distinguish old from current requests.</p>
<p>The <strong>Token Ring algorithm</strong> is the simplest member and the one named in the syllabus:</p>
<ol>
<li>The n processes P1, P2, &hellip; Pn are arranged in a logical ring. The ring is created by giving each process the address of one other process, its neighbour in the clockwise direction. The logical ring topology is unrelated to the physical interconnections between the computers.</li>
<li>The token is initially given to one process and is passed from one process to its neighbour round the ring.</li>
<li>When a process requires to enter the critical section, it waits until it receives the token from its left neighbour and then retains it; after entering and leaving the critical section it passes the token to its neighbour in the clockwise direction.</li>
<li>When a process receives the token but does not require the critical section, it immediately passes the token on along the ring.</li>
</ol>
<table class="comparison-table">
<thead>
<tr><th>Property</th><th>Consequence</th></tr>
</thead>
<tbody>
<tr><td>It can take from 1 to n&minus;1 messages to obtain a token.</td><td>Worst-case latency is a full lap of the ring.</td></tr>
<tr><td>Messages are sent around the ring even when no process requires the token.</td><td>Additional load on the network in the idle case.</td></tr>
<tr><td>It works well in heavily loaded situations, when there is a high probability that the process receiving the token wants to enter the critical section.</td><td>High utilisation means few wasted laps.</td></tr>
<tr><td>It works poorly in lightly loaded cases.</td><td>Most laps carry a token nobody wanted.</td></tr>
<tr><td>If a process fails, no progress can be made until a reconfiguration extracts the process from the ring.</td><td>The failure-handling problem is not in the algorithm but in the recovery around it.</td></tr>
<tr><td>If the process holding the token fails, a unique process has to be picked to regenerate the token and pass it along the ring &mdash; an election algorithm has to be run for this purpose.</td><td>Token loss is why the ring needs an election algorithm.</td></tr>
</tbody>
</table>
<h3>The three named algorithms side by side</h3>
<p>The three algorithms the syllabus names separate cleanly on two numbers and one failure:</p>
<table class="comparison-table">
<thead>
<tr><th>Algorithm</th><th>Messages per entry and exit</th><th>Delay before entry</th><th>What stops it</th></tr>
</thead>
<tbody>
<tr><td><strong>Central coordinator</strong></td><td>3 &mdash; a request, a grant and a release</td><td>2 message times: the request out and the grant back</td><td>The coordinator itself. Its crash grants nothing to anybody, and a blocked client cannot tell a dead coordinator from a refusal.</td></tr>
<tr><td><strong>Ricart&ndash;Agrawala</strong></td><td>2(n &minus; 1) &mdash; a request to each of the other n &minus; 1 nodes and a reply from each</td><td>The maximum message transmission time, because the requests go out to every node at once</td><td>Any node. There is no central site to lose, but every node must be reachable, and one silent node holds up every request it owes a reply to.</td></tr>
<tr><td><strong>Token ring</strong></td><td>1 to n &minus; 1 to <em>obtain</em> the token, plus every lap of the ring that nobody wanted</td><td>0 to n &minus; 1 hops: however far away the token happens to be</td><td>The token. A token that is lost, or a holder that dies, stops every process until an election regenerates it (3.4).</td></tr>
</tbody>
</table>
<p>The coordinator's three messages are the cheapest entry and the worst failure: mutual exclusion that is easy to argue, resting on one machine whose crash freezes the group. The token ring is the reverse &mdash; entering costs nothing once the token has arrived, and the price is that the right to enter is a single object that can be lost. The counts and the delay column assume messages are sent one after another. Told with the requests in flight together, Ricart&ndash;Agrawala's synchronization delay is the maximum message transmission time, which is the same cost seen the other way round.</p>

<h2>3.4 Election Algorithms (Bully, Ring)</h2>

<p>In distributed computing, leader election is the process of designating a single process as the organizer of some task distributed among several computers (nodes). Before the task begins, all nodes are unaware which node will serve as the leader, or coordinator; after a leader election algorithm has run, each node throughout the network recognizes a particular, unique node as the task leader.</p>

<p>Many distributed algorithms require one process to act as a coordinator or perform some special role, and that coordinator is selected using an election algorithm. Why an election is needed, by situation:</p>
<table class="comparison-table">
<thead>
<tr><th>Situation</th><th>Why an election is needed</th></tr>
</thead>
<tbody>
<tr><td><strong>Clock synchronization</strong> (Berkeley algorithm)</td><td>To select a leader or master to take responsibility for averaging the time.</td></tr>
<tr><td><strong>Mutual exclusion</strong> &mdash; central coordinator algorithm</td><td>At initialization, or whenever the coordinator crashes, a new coordinator has to be elected.</td></tr>
<tr><td><strong>Mutual exclusion</strong> &mdash; token ring algorithm</td><td>When the process holding the token fails, a new process has to be elected which generates the new token.</td></tr>
<tr><td><strong>Any distributed computing</strong></td><td>A distributed algorithm does not assume the previous existence of a central coordinator; a master must be selected to distribute sub-problems among the slaves and collect the partial results from them.</td></tr>
</tbody>
</table>

<h3>Basic concepts</h3>
<ul>
<li>A unique priority number is associated with each active process, with the priority number of process P<sub>i</sub> being <em>i</em>, and there is a one-to-one correspondence between processes and sites.</li>
<li>The coordinator is always the process with the largest priority number; when a coordinator fails, the algorithm must elect the <strong>active</strong> process with the largest priority number. A crashed node keeps its high number but cannot win.</li>
<li>It does not matter which process is elected; what is important is that one and only one process is chosen and that all processes agree on this decision.</li>
<li>Election is typically started after a failure occurs. Detection of failure (for example, the crash of the current coordinator) is normally based on a time-out: a process that gets no response for a period of time suspects a failure and initiates an election.</li>
</ul>
<p>Every election algorithm has two phases:</p>
<ol>
<li>Select a leader with the highest priority.</li>
<li>Inform all processes about the winner.</li>
</ol>

<h3>The Bully algorithm</h3>
<p>The Bully algorithm is applicable to elect a leader in a distributed system in which every process can send a message to every other process &mdash; a mesh topology is the standard example. It is a method for dynamically selecting a coordinator by process ID number.</p>

<p>Assumptions: the system is <strong>synchronous</strong> and uses time-out for identifying process failure. Each process knows which process has the higher identifier number and communicates with it.</p>

<p><strong>Three message types</strong>:</p>
<table class="comparison-table">
<thead>
<tr><th>Message</th><th>Meaning</th></tr>
</thead>
<tbody>
<tr><td><strong>Election message</strong></td><td>Sent to announce an election.</td></tr>
<tr><td><strong>Answer message</strong></td><td>Sent to respond to an election message &mdash; the "I am alive" reply.</td></tr>
<tr><td><strong>Coordinator message</strong></td><td>Sent to announce the identity of the elected process.</td></tr>
</tbody>
</table>

<p><strong>Basic steps.</strong> When a process P determines that the current coordinator is down &mdash; because of message time-outs, or the coordinator's failure to initiate a handshake &mdash; it performs the following sequence:</p>
<ol>
<li>P broadcasts an election message (inquiry) to all other processes with higher process IDs.</li>
<li>If P hears from no process with a higher process ID than it, it wins the election and broadcasts victory.</li>
<li>If P hears from a process with a higher ID, P waits a certain amount of time for that process to broadcast itself as the leader. If it does not receive this message in time, it re-broadcasts the election message.</li>
<li>If P gets an election message from another process with a lower ID, it sends an "I am alive" message back and starts a new election.</li>
</ol>

<div class="concept-box key">
<h4>Where the name comes from</h4>
<p>One sentence explains the name: if P receives a victory message from a process with a lower ID number, it immediately initiates a new election. A process with a higher ID number will bully a lower ID process out of the coordinator position as soon as it comes online. The recovered process does not accept the existing coordinator, however well it is working; a bigger number always wins.</p>
</div>

<p>The detailed algorithm is the same rules stated with the two time-out intervals made explicit:</p>
<ul>
<li>If process P<sub>i</sub> sends a request that is not answered by the coordinator within a time interval T, assume the coordinator has failed and P<sub>i</sub> tries to elect itself as the new coordinator.</li>
<li>P<sub>i</sub> sends an election message to every process with a higher priority number, then waits for any of these processes to answer within T.</li>
<li>If no response within T, assume all processes with numbers greater than <em>i</em> have failed, and P<sub>i</sub> elects itself the new coordinator.</li>
<li>If an answer is received, P<sub>i</sub> begins time interval T&prime;, waiting to receive a message that a process with a higher priority number has been elected.</li>
<li>If no message is sent within T&prime;, assume the process with the higher number has failed, and P<sub>i</sub> should restart the algorithm.</li>
</ul>
<p>Two further rules describe what happens to a process that is <em>not</em> the coordinator. At any time during execution, P<sub>i</sub> may receive one of two messages from process P<sub>j</sub>:</p>
<ul>
<li>P<sub>j</sub> is the new coordinator (j &gt; i) &mdash; P<sub>i</sub> records this information.</li>
<li>P<sub>j</sub> started an election (j &gt; i) &mdash; P<sub>i</sub> sends a response to P<sub>j</sub> and begins its own election algorithm, provided it has not already initiated one.</li>
</ul>
<p>And the rule for a node coming back from failure: after a failed process recovers, it immediately begins execution of the same algorithm. If there are no active processes with higher numbers, the recovered process forces all processes with lower numbers to let it become the coordinator &mdash; even if there is currently an active coordinator with a lower number.</p>
<figure class="figure-wide figure-wrap">
<svg class="figure wide" viewBox="0 0 800 320" role="img" aria-label="Bully election with six processes P0 to P5: P2 starts an election to higher-numbered processes, P3 and P4 answer and start their own elections, P4 gets no answer from P5 and announces itself coordinator to everyone">
<defs><marker id="f3c" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="flow-arrow-head"/></marker></defs>

<rect class="flow-box phase1" x="30" y="60" width="90" height="40" rx="8"/><text class="flow-text" x="75" y="85">P0</text>
<rect class="flow-box phase1" x="150" y="60" width="90" height="40" rx="8"/><text class="flow-text" x="195" y="85">P1</text>
<rect class="flow-box phase2" x="270" y="60" width="90" height="40" rx="8"/><text class="flow-text" x="315" y="85">P2</text>
<rect class="flow-box phase3" x="390" y="60" width="90" height="40" rx="8"/><text class="flow-text" x="435" y="85">P3</text>
<rect class="flow-box phase3" x="510" y="60" width="90" height="40" rx="8"/><text class="flow-text" x="555" y="85">P4</text>
<rect class="flow-box phase4" x="630" y="60" width="90" height="40" rx="8"/><text class="flow-text" x="675" y="85">P5 down</text>

<text class="flow-label" x="315" y="42" text-anchor="middle">1. P2 initiates election</text>
<path class="flow-arrow" d="M360,72 C420,26 500,26 550,58" marker-end="url(#f3c)"/>
<path class="flow-arrow" d="M360,88 C420,120 500,120 550,100" marker-end="url(#f3c)"/>
<text class="flow-label" x="455" y="150" text-anchor="middle">2. P3 and P4 answer OK</text>

<text class="flow-label" x="435" y="180" text-anchor="middle">3. P3 and P4 each start their own election</text>
<path class="flow-arrow" d="M600,72 C650,30 690,30 690,54" marker-end="url(#f3c)"/>
<text class="flow-label" x="672" y="24" text-anchor="middle">4. P5 does not answer</text>

<text class="flow-label" x="555" y="212" text-anchor="middle">5. P4 receives no reply and announces itself coordinator</text>
<path class="flow-arrow" d="M510,214 H130" marker-end="url(#f3c)"/>
<path class="flow-arrow" d="M510,214 H130" marker-end="url(#f3c)"/>
<text class="flow-label" x="320" y="236" text-anchor="middle">coordinator message to every process (P5 excluded &mdash; it is not answering)</text>

<text class="flow-label" x="400" y="272" text-anchor="middle">When P5 recovers it runs the algorithm immediately and, having the highest number,</text>
<text class="flow-label" x="400" y="294" text-anchor="middle">bullies P4 out of the coordinator role even though P4 is working fine.</text>
</svg>
<figcaption>Fig 3.3 &mdash; The Bully algorithm's five steps: P2 initiates an election, P3 and P4 answer and start elections of their own, P5 does not answer, and P4 receives no reply from a higher number and announces itself coordinator to every process except the silent P5. If P5 comes back it runs the algorithm immediately and, having the highest number, bullies P4 out of the role.</figcaption>
</figure>
<h3>The Ring algorithm (Chang and Roberts)</h3>
<p>Chang and Roberts is a ring-based election algorithm used to find the process with the largest identification. It is a useful method of election in decentralized distributed computing where the systems are connected in a logical or physical ring. It works for any number of processes N, and does not require any process to know how many processes are in the ring &mdash; which is its main advantage over the Bully algorithm's assumption that everyone can reach everyone.</p>

<p>Assumptions: the system is organized as a ring, logically or physically. The links are unidirectional and processes send their messages to their right neighbours. Each process maintains an active list, consisting of the priority numbers of all active processes in the system when the algorithm ends.</p>
<p>Two statements of the same algorithm are given below, and both describe the same messages: one as a sequence of steps, the other as a summary of what the election message carries.</p>
<p><strong>The second formulation</strong>, which is the clearest one to reproduce:</p>
<ol>
<li>Initially each process in the ring is marked as non-participant.</li>
<li>A process that notices a lack of leader starts an election, creating an election message containing <strong>its own UID</strong> and sending it <strong>clockwise to its neighbour</strong>.</li>
<li>Every time a process sends or forwards an election message it marks itself as a participant.</li>
<li>When a process receives an election message it compares the UID in the message with its own UID, and answers in one of these ways:
<ul>
<li>If the UID in the message is larger, it unconditionally forwards the message clockwise.</li>
<li>If the UID in the message is smaller and the process is not yet a participant, it replaces the UID in the message with its own UID and sends the updated message clockwise.</li>
<li>If the UID in the message is smaller and the process is already a participant, it discards the election message.</li>
<li>If the UID in the incoming message is the same as the process's own UID, that process starts acting as the leader.</li>
</ul>
</li>
<li>The leader then begins the second phase: it marks itself as non-participant and sends an elected message to its neighbour announcing its election and UID.</li>
<li>When a process receives an elected message it marks itself non-participant, records the elected UID, and forwards the elected message unchanged.</li>
<li>When the elected message reaches the newly elected leader, the leader discards it and the election is over.</li>
</ol>

<p>The earlier formulation is a useful summary of the message contents: the election message circulates around the ring bypassing failed nodes, and each node appends its id to the message as it passes it on. When the message returns to the initiator, it elects the node with the best election attribute value and sends a coordinator message with the new coordinator's id. That message accumulates ids as it circulates. Once the coordinator message returns to the initiator, the election is over if the coordinator is in the id-list; otherwise the algorithm is repeated &mdash; which is how a failed election is handled.</p>

<div class="concept-box tip">
<h4>The failure case both ring examples are testing</h4>
<p>The first ring example shows the algorithm surviving a candidate that dies mid-election: P2 initiates, the election message gathers {2, 3, 4}, P2 selects 4 and announces it. Then P4 dies, so when the coordinator message comes back to P2 the list does not include 4. P2 re-initiates the election, and P3 is finally elected. That "if the coordinator is not in the id-list, repeat" step is the whole reason the ring algorithm tolerates failure during the election.</p>
</div>

<p>The second example is the standard six-process walkthrough: six processes in a logical ring with P6 as leader. P6 fails. P3 notices P6 does not respond and starts an election, sending its id to the next node; each of P5, P0, P1 and P4 passes the message on, adding its own id. When the message returns to P3 it recognises its own id in the list, picks the highest id (5) and sends "5 is the leader" around the ring, where each process passes on the coordinator message until it reaches P3, which stops it.</p>

<h3>Bully versus Ring &mdash; the comparison</h3>
<table class="comparison-table">
<thead>
<tr><th></th><th>Bully algorithm</th><th>Ring (Chang and Roberts) algorithm</th></tr>
</thead>
<tbody>
<tr><td><strong>Topology assumed</strong></td><td>Every process can send a message to every other process (a mesh, for example).</td><td>The processes are organized as a logical or physical ring, with unidirectional links to the right neighbour.</td></tr>
<tr><td><strong>Who can be elected</strong></td><td>The active process with the largest process ID.</td><td>The process with the <strong>largest identification</strong> (UID) &mdash; the same criterion.</td></tr>
<tr><td><strong>Messages</strong></td><td>Election messages to <em>all higher-numbered</em> processes, answers from those that are alive, then a victory broadcast. A process may restart the algorithm when it gets no follow-up within T&prime;.</td><td>One election message that travels the ring accumulating ids, then one coordinator message that travels the ring again. Two laps in the normal case.</td></tr>
<tr><td><strong>Knowledge required</strong></td><td>Each process must know the identifiers of higher-numbered processes and be able to reach them.</td><td>No process needs to know how many processes are in the ring, and it works for any N.</td></tr>
<tr><td><strong>How failure is handled</strong></td><td>Time-outs (T for the coordinator, T&prime; for a higher process to announce itself) determine staleness, then the process restarts the algorithm.</td><td>Failed nodes are <strong>bypassed</strong> as the message circulates; if the elected candidate turns out to be dead, the initiator repeats the election when the coordinator message returns without it.</td></tr>
<tr><td><strong>Characteristic behaviour</strong></td><td>A recovered high-numbered process immediately bullies the current coordinator out of the role.</td><td>Fully decentralized; the election is driven by whoever notices the failure.</td></tr>
</tbody>
</table>

<p class="past-pointer">Questions on this unit, with model answers, are on the <a href="#/ch/3/past">Past Questions</a> tab.</p>
`,
  revise: {"3.0":"<p>Time is the most important practical issue in distributed systems, and the most problematic.</p>\n<ul>\n<li>Each computer has its own clock, so there is no single clock to read.</li>\n<li>Clocks <strong>deviate</strong>, and they cannot be synchronized perfectly.</li>\n<li>Without global physical time it is hard to say what state one process is in when another is in a given state.</li>\n<li>Commerce still needs transactions timestamped consistently, and an execution read as an order of events.</li>\n</ul>\n","3.1":"<p>Clock synchronization splits into two families: <strong>physical clock synchronization</strong> and <strong>logical clock synchronization</strong>.</p>\n<ul>\n<li>Physical: <strong>Cristian's algorithm</strong> for a centralized system and the <strong>Network Time Protocol</strong> for a distributed one.</li>\n<li>Logical: <strong>Lamport timestamps</strong> and <strong>vector clocks</strong>, both distributed.</li>\n<li>The clocks themselves are moved toward real time only in the first family; a logical clock is a counter that captures causal order numerically.</li>\n</ul>\n","3.2":"<p>Clock synchronization minimizes the difference between the accepted actual time and the time on a client machine.</p>\n<ul>\n<li>Even so, relying on local clock time stays risky: a recorded time may have happened at a different time on another computer, because of differing <strong>drift rates</strong>.</li>\n<li>Correcting time means the machines are much closer to each other on average, not that they all agree on time.</li>\n</ul>\n","3.4":"<p>Leader election designates one process as the organizer of a task distributed among several nodes.</p>\n<ul>\n<li>Before it runs no node knows who will lead; afterwards every node recognizes the same unique leader.</li>\n<li>It selects a master to take responsibility for averaging the time in the Berkeley algorithm.</li>\n<li>It is needed at initialization of a central coordinator, or whenever the coordinator crashes, and in the token ring when the token holder fails.</li>\n<li>A distributed algorithm assumes no coordinator exists: a master distributes sub-problems and collects the partial results.</li>\n</ul>\n","how-a-computer-timer-actually-works":"<p>A computer timer is a <strong>counter register</strong> and a <strong>holding register</strong>, decremented by a quartz crystal oscillator and reloaded at zero.</p>\n<ul>\n<li>Each interrupt is a <strong>clock tick</strong>; the resulting <strong>physical clock</strong> counts oscillations at a definite frequency.</li>\n<li>Drift rate is how fast a clock deviates from real time, and it decides how often to synchronize.</li>\n<li>A synchronized clock must not deviate from real time by more than a certain amount.</li>\n<li>Time is needed for performance measurement, recent data, temporal ordering, sender and receiver synchronization and shared access.</li>\n</ul>\n","what-unsynchronized-clocks-break-the-make-example":"<p>The classic failure is <strong>make</strong>, which uses the clock of the machine it runs on to decide which source files need recompiling.</p>\n<ul>\n<li>With the sources on a separate file server and unsynchronized clocks, it may treat an output as newer than its source and skip a rebuild that was needed.</li>\n<li>The general statement: an event that occurred after another may be assigned an earlier time.</li>\n<li>That is a correctness problem, not a performance problem.</li>\n</ul>\n","event-ordering-and-the-happened-before-relation":"<p>With no common memory and no common clock, two events sometimes cannot be ordered by measurement, so order is defined without time.</p>\n<ul>\n<li>The <strong>happened-before relation</strong> is a partial ordering from three rules: order within a process, send before receive, and transitivity.</li>\n<li>Events not related by it are <strong>concurrent</strong>: no causal relationship between them.</li>\n<li>A global order comes from timestamps where A &rarr; B implies ts(A) &lt; ts(B).</li>\n<li>The requirement is one-directional: a timestamp order does not prove a causal order.</li>\n</ul>\n","causal-ordering-of-messages":"<p>If M1 is sent before M2, every recipient of both must get M1 before M2, and the network does not promise that.</p>\n<ul>\n<li>In a replicated database, updates must be received in order or the <strong>replicas</strong> diverge.</li>\n<li>The fix is to <strong>buffer</strong> a later message until the earlier one it depends on has been delivered.</li>\n<li>A message can take a different route and overtake an earlier one.</li>\n<li>Lamport timestamps cannot decide dependency; <strong>vector clocks</strong> can.</li>\n</ul>\n","cristian-s-algorithm":"<p><strong>Cristian's algorithm</strong> relies on a <strong>time server</strong> whose clock comes from a radio clock or other accurate source of UTC.</p>\n<ul>\n<li>The client requests the time; the server replies with the time T from its own clock appended.</li>\n<li>The client sets its clock to T + RTT/2, where RTT is the round-trip time of the request.</li>\n<li>Both timestamps come from the client's clock, and the one-way delay is assumed to be half the round trip.</li>\n<li>Accuracy is &plusmn; RTT/2, and the interrupt-handling time is a third quantity to subtract.</li>\n</ul>\n","how-accurate-is-cristian-s-algorithm-exactly":"<p>The method assumes the round trip is split equally between request and response, a reasonable assumption on a LAN connection.</p>\n<ul>\n<li>Accuracy improves by making multiple requests and using the response with the shortest RTT.</li>\n<li>If min is the one-way transmission time, the server's time when the reply arrives lies between (T + min) and (T + RTT &minus; min).</li>\n<li>The width of that range is (RTT &minus; 2&middot;min), giving an accuracy of (RTT/2 &minus; min).</li>\n<li>The server must change its time gradually, by <strong>slewing</strong> the clock rather than setting it.</li>\n</ul>\n","network-time-protocol-ntp":"<p><strong>NTP</strong> is the most commonly used internet time protocol and the one with the best accuracy.</p>\n<ul>\n<li>Clients get updates from one or more servers and average them; the version that skips this is <strong>SNTP</strong>.</li>\n<li>Servers listen on port <strong>123</strong> and reply with a UDP/IP packet carrying a 64-bit timestamp in UTC seconds since 1 Jan <strong>1900</strong>.</li>\n<li>Time sources form a synchronization subnet of <strong>strata</strong>: the first stratum connects directly to an accurate source, each below synchronized from the one above.</li>\n</ul>\n","ntp-goals-and-synchronization-modes":"<p>NTP's goals: accuracy to UTC despite message delays, filtering by statistics, reliable service, frequent synchronization, authentication.</p>\n<ul>\n<li>Multicast is low accuracy, for quick LANs: the server periodically multicasts its time to its clients in the subnet.</li>\n<li>Remote Procedure Call is medium accuracy: the server replies with its actual timestamp.</li>\n<li>Symmetric mode is high accuracy, used to synchronize between the time servers, peer to peer.</li>\n<li>All three are delivered unreliably over UDP, so the protocol needs many rounds and statistical filtering.</li>\n</ul>\n","the-ntp-offset-derivation":"<p>Four timestamps: T1 when the client sends, T2 when the server receives, T3 when the server responds, T4 when the client receives the response.</p>\n<ul>\n<li>The client knows (T4 &minus; T1) from its own clock, and the server reports T3 and T2.</li>\n<li>Total transit time is (T4 &minus; T1) &minus; (T3 &minus; T2): elapsed time minus the time the server spent working.</li>\n<li>With the transit time split equally, &theta; = [(T2 &minus; T1) + (T3 &minus; T4)] / 2.</li>\n<li>Without that subtraction, server processing time is counted as network delay.</li>\n</ul>\n","the-berkeley-algorithm-when-no-machine-has-a-utc-receiver":"<p>The <strong>Berkeley algorithm</strong> agrees on a time by averaging the machines' clocks: a <strong>time daemon</strong> asks every machine for the time, averages the answers, and tells each how to adjust.</p>\n<ul>\n<li>Its server is active, where Cristian's and NTP's servers wait to be asked.</li>\n<li>Nothing refers to real time, so it is internal synchronization, for a system with no UTC receiver.</li>\n<li>The agreed time is only as good as the daemon's own clock, and the daemon itself is chosen by an election (3.4).</li>\n</ul>\n","logical-clocks-the-idea":"<p>A <strong>logical clock</strong> is a monotonically increasing software counter whose value need bear no particular relationship to any physical clock.</p>\n<ul>\n<li>Each process keeps its own clock and uses it to apply <strong>Lamport timestamps</strong> to events, giving consistent event ordering.</li>\n<li>The clocks only have to be <strong>internally consistent</strong>; a shared 10:00 is enough even if it is really 10:02.</li>\n<li>Logical clocks live in the <strong>middleware</strong> layer, which timestamps on send and updates on receipt, so the application never touches a clock.</li>\n</ul>\n","lamport-s-algorithm":"<p>A <strong>Lamport</strong> logical clock is an incrementing software counter per process, with three rules.</p>\n<ul>\n<li>A process increments its counter before each event in that process.</li>\n<li>On sending the value travels with the message; on receiving, the counter is set above the maximum of its own value and the received one.</li>\n<li>The result is a <strong>total order</strong> over all events, enough to order concurrent requests for one resource.</li>\n<li>A smaller timestamp does not imply the event happened first: concurrent events can carry 3 and 7.</li>\n</ul>\n","lamport-s-considerations-and-the-limitation":"<p>Within a process no two events may share a timestamp, and a unique <strong>process ID</strong> may be needed to tell simultaneous events apart.</p>\n<ul>\n<li>A system has <strong>partial order</strong> when a partial-order relationship exists among its events, and <strong>total order</strong> when causality relates them all.</li>\n<li>In replicated systems, an update is timestamped at its accepting site and ordered by source timestamp at the receiver.</li>\n<li>Lamport clocks give a total order consistent with causality, but ts(a) &lt; ts(b) does not imply a &rarr; b.</li>\n</ul>\n","vector-clocks":"<p>A <strong>vector clock</strong> is an array of N logical clocks, one per process, which detects causality violations.</p>\n<ul>\n<li>TS[i] at site i is the most recent value of site j's clock that site i has heard about.</li>\n<li>An internal event increments the process's own clock in the vector; a send increments it and sends the whole vector.</li>\n<li>A receive increments it again and takes the pairwise maximum with the received vector.</li>\n<li>Two events are causally related exactly when one vector dominates the other, and non-dominating vectors are provably concurrent.</li>\n</ul>\n","causal-ordering-of-messages-using-vector-clocks":"<p>Causal ordering keeps the causal order of receives the same as the order of sends.</p>\n<ul>\n<li>Two named algorithms: <strong>BSS</strong> causal ordering of broadcasts and <strong>SES</strong> causal ordering of regular messages.</li>\n<li>Both delay an out-of-order message until the messages it depends on have been delivered.</li>\n<li>To delay a message you must decide whether it is later than one still awaited, and Lamport timestamps cannot answer that; a vector timestamp can.</li>\n<li>M1 causally precedes M2 exactly when M1's vector is dominated by M2's.</li>\n</ul>\n","background":"<p>Mutual exclusion is needed only where processes must exchange information to reach agreement.</p>\n<ul>\n<li>One-way communication usually does not need it, and in client/server communication the server handles coordination, so the clients never interact.</li>\n<li>A <strong>critical section</strong> is a region where a process competes destructively with another for a shared item.</li>\n<li>A <strong>race condition</strong> comes from two processes entering that region at the same time.</li>\n<li><strong>Mutual exclusion</strong> is the solution: only one process enters the critical section at a time.</li>\n</ul>\n","the-four-requirements":"<p>The four requirements: <strong>safety</strong>, <strong>liveness</strong>, <strong>no starvation</strong> and <strong>fairness</strong>.</p>\n<ul>\n<li>Safety: at most one process in the critical section.</li>\n<li>Liveness: if more than one process is requesting, someone enters.</li>\n<li>No starvation: a requesting process enters within a finite time.</li>\n<li>Fairness: requests are granted in order, which implies no starvation and liveness; safety says what must never happen, the other three are claims about progress.</li>\n</ul>\n","the-two-approaches-and-the-algorithm-families":"<p>Two families answer who may enter: <strong>permission-based</strong> and <strong>token-based</strong>.</p>\n<ul>\n<li>Permission-based: every process competes freely, and requests are arbitrated by a central coordinator or by distributed agreement.</li>\n<li>Named algorithms: a central coordinator, <strong>Lamport's</strong>, <strong>Ricart&ndash;Agrawala</strong> and the <strong>Token Ring</strong>.</li>\n<li>Asking first costs messages and usually a wait on failure; holding a token costs nothing but must be found when lost.</li>\n</ul>\n","ricart-agrawala-the-syllabus-s-named-non-token-algorithm":"<p><strong>Ricart&ndash;Agrawala</strong> improves on Lamport's algorithm: a node need not send a REPLY when it holds a request with a lower timestamp.</p>\n<ul>\n<li>No <strong>FIFO channels</strong> are required, because ordering is carried in the timestamps.</li>\n<li>Cost: <strong>2(n &minus; 1) messages</strong> per critical-section invocation, a request to every other node and a reply from every other node.</li>\n<li>Requests are granted in order of increasing timestamps; the synchronization delay is the maximum transmission time.</li>\n<li>A node enters on replies from all nodes, then replies to the requests it deferred.</li>\n</ul>\n","token-based-algorithms-and-the-token-ring":"<p>A single <strong>token</strong> circulates, and whoever holds it may enter the critical section.</p>\n<ul>\n<li>In the <strong>Token Ring algorithm</strong> the n processes form a logical ring, each holding the address of one neighbour clockwise.</li>\n<li>A process waits for the token from its left neighbour, then passes it on clockwise.</li>\n<li>Obtaining the token can take from 1 to n &minus; 1 messages, and the worst case is a full lap.</li>\n<li>It works well when heavily loaded; if the holder fails, a unique process must be elected to regenerate the token.</li>\n</ul>\n","the-three-named-algorithms-side-by-side":"<p>The three named algorithms trade cost against failure: the <strong>central coordinator</strong> is cheapest and most fragile, <strong>Ricart&ndash;Agrawala</strong> spreads the cost across every node, and the <strong>token ring</strong> makes the right to enter an object that can be lost.</p>\n<ul>\n<li>Messages per entry and exit: 3, 2(n &minus; 1), and 1 to n &minus; 1 to obtain the token.</li>\n<li>Delay before entry: 2 message times, the maximum message transmission time, and 0 to n &minus; 1 hops.</li>\n<li>What stops it: the coordinator's crash, an unreachable node, a lost token.</li>\n</ul>\n","basic-concepts":"<p>A unique <strong>priority number</strong> is associated with each active process, and the coordinator is always the process with the largest priority number.</p>\n<ul>\n<li>When the coordinator fails, the active process with the largest priority number is elected; a crashed node cannot win.</li>\n<li>The requirement is that one and only one process is chosen and that all agree on the decision.</li>\n<li>Election starts after a failure, normally detected by a <strong>time-out</strong>.</li>\n<li>Two phases: select the leader with the highest priority, then inform all processes of the winner.</li>\n</ul>\n","the-bully-algorithm":"<p>Bully elects the active process with the largest process ID where every process can reach every other.</p>\n<ul>\n<li>Three messages: an <strong>election message</strong>, an <strong>answer</strong> that it is alive, and a <strong>coordinator</strong> message naming the winner.</li>\n<li>A process finding the coordinator down messages every higher ID, and elects itself if none answers within T.</li>\n<li>If a higher process answers, it waits T&prime; for that process to announce itself, then restarts if nothing arrives.</li>\n<li>A recovered high-numbered process runs the algorithm at once and bullies a lower-numbered coordinator out.</li>\n</ul>\n","the-ring-algorithm-chang-and-roberts":"<p><strong>Chang and Roberts</strong> elects the largest identification in a logical or physical ring.</p>\n<ul>\n<li>It works for any number of processes N, with no process knowing the ring size.</li>\n<li>A process that notices a lack of leader sends an election message with its own UID to its neighbour clockwise.</li>\n<li>On receiving one, a process forwards a larger UID and replaces a smaller one it has not already forwarded.</li>\n<li>When a UID returns to its own process, that process is the leader and sends an elected message round the ring.</li>\n</ul>\n","bully-versus-ring-the-comparison":"<p>The two agree on who wins, the largest identifier, and differ in what they assume.</p>\n<ul>\n<li>Bully assumes every process can message every other, a mesh for example; the ring assumes unidirectional links to the right neighbour.</li>\n<li>Bully sends election messages to every higher number, answers from the living, then a victory broadcast.</li>\n<li>The ring costs one election message that accumulates ids and one coordinator message, two laps normally; bully needs each process to know the higher numbers, while the ring works for any N.</li>\n</ul>\n"},
  pastSummary: `<h2>Exam-facing summary</h2>
<table class="comparison-table">
<thead>
<tr><th>If the question says&hellip;</th><th>Give&hellip;</th></tr>
</thead>
<tbody>
<tr><td>List two clock synchronization algorithms (2 marks)</td><td>Cristian's algorithm and NTP (physical) &mdash; or Lamport timestamps and vector clocks (logical). Add which family each belongs to.</td></tr>
<tr><td>Explain Cristian's algorithm</td><td>Time server with a radio clock / UTC source; client requests the time, server appends T, client sets its clock to <strong>T + RTT/2</strong>; the worked example; accuracy <strong>&plusmn;RTT/2</strong>, improved to <strong>(RTT/2 &minus; min)</strong> by using the shortest of several round trips.</td></tr>
<tr><td>Explain NTP</td><td>Port 123, UDP, 64-bit timestamp in UTC seconds since 1 Jan 1900 with 200 ps resolution; strata and the synchronization subnet; the three modes (multicast, RPC, symmetric); and the offset formula <strong>&theta; = [(T2 &minus; T1) + (T3 &minus; T4)]/2</strong> with the four timestamps named.</td></tr>
<tr><td>Explain Lamport's logical clock with an example (4 marks)</td><td>The three rules, Fig 3.2, and the limitation: <strong>a &rarr; b implies ts(a) &lt; ts(b), but not the converse</strong>.</td></tr>
<tr><td>Why do we need vector clocks?</td><td>Because Lamport timestamps give false positives &mdash; <code>LC(e1) &lt; LC(e2)</code> can hold for concurrent events, so concurrent updates may be ordered unnecessarily; a vector clock is necessary and sufficient, since non-dominating vectors prove concurrency.</td></tr>
<tr><td>Explain mutual exclusion in distributed systems</td><td>The definitions (critical section, race condition, mutual exclusion), the four requirements (safety, liveness, no starvation, fairness), and the two approaches with their named algorithms.</td></tr>
<tr><td>Explain the Ricart&ndash;Agrawala algorithm</td><td>The improvement over Lamport, the REQUEST/REPLY rules including the deferred requests, 2(n&minus;1) messages, no FIFO requirement, and reply-on-release.</td></tr>
<tr><td>Explain the Token Ring algorithm</td><td>Logical ring unrelated to the physical topology, one token, retain on entry and pass clockwise after leaving, itself passed on when unwanted, and the problems: 1 to n&minus;1 messages, idle traffic, failure requiring reconfiguration, and token regeneration needing an election.</td></tr>
<tr><td>Describe the Bully election algorithm (8 marks)</td><td>Purpose and assumptions (synchronous, time-out failure detection, largest ID wins), the three message types, the four basic steps and the detailed T / T&prime; version, Fig 3.3, <strong>why it is called Bully</strong>, recovery behaviour, and applications (clock synchronization/leader, central coordinator replacement, token regeneration, and master selection in any decentralized computation).</td></tr>
<tr><td>Compare Bully and Ring</td><td>The table &mdash; topology, message pattern, knowledge required, and failure handling.</td></tr>
</tbody>
</table>


`,

  reference: `
<h2>Reference material</h2>
<p class="ref-intro">The teacher puts a circled <span class="tmark" aria-hidden="true"></span> on the slides he keeps for reference rather than for the paper. His decks carry the sign on 28 slides in all; 9 of them are pictures these notes had used, so they are collected here and the notes themselves teach only what the syllabus names. Each entry below says which section of the notes it came out of.</p>

<h3>How a computer timer actually works</h3>

<p class="ref-meta">From <em>Ch_3_Sync_and_Cordn.pptx</em>, slide 5 &mdash; the teacher marks these slides, so the pictures are kept here and the notes keep the section itself, because the syllabus names it.</p>

<!-- dcc-fig:ch3/ch-3-sync-and-cordn-s05-040.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch3/ch-3-sync-and-cordn-s05-040.webp" alt="Not all clocks tick precisely at the current rate." width="1600" height="1392" loading="lazy" decoding="async">
<figcaption>Not all clocks tick precisely at the current rate.</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>What unsynchronized clocks break &mdash; the make example</h3>

<p class="ref-meta">From <em>Ch_3_Sync_and_Cordn.pptx</em>, slide 8 &mdash; the teacher marks these slides, so the pictures are kept here and the notes keep the section itself, because the syllabus names it.</p>

<!-- dcc-fig:ch3/ch-3-sync-and-cordn-s08-041.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch3/ch-3-sync-and-cordn-s08-041.webp" alt="Fig: When each machine has its own clock, an event that occurred after another event may nevertheless be…" width="579" height="168" loading="lazy" decoding="async">
<figcaption>Fig: When each machine has its own clock, an event that occurred after another event may nevertheless be…</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>Causal ordering of messages using vector clocks</h3>

<p class="ref-meta">From <em>Ch_3_Sync_and_Cordn.pptx</em>, slide 48 &mdash; the teacher marks these slides, so the pictures are kept here and the notes keep the section itself, because the syllabus names it.</p>

<!-- dcc-fig:ch3/ch-3-sync-and-cordn-s48-050.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch3/ch-3-sync-and-cordn-s48-050.webp" alt="Causal Ordering of Message using Vector Clock" width="648" height="291" loading="lazy" decoding="async">
<figcaption>Causal Ordering of Message using Vector Clock</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>Basic concepts</h3>

<p class="ref-meta">From <em>Ch_3_Sync_and_Cordn.pptx</em>, slides 68&ndash;69 &mdash; the teacher marks these slides, so the pictures are kept here and the notes keep the section itself, because the syllabus names it.</p>

<!-- dcc-fig:ch3/ch-3-sync-and-cordn-s68-060.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch3/ch-3-sync-and-cordn-s68-060.webp" alt="Election Algorithm: Basic Concepts (1)" width="704" height="329" loading="lazy" decoding="async">
<figcaption>Election Algorithm: Basic Concepts (1)</figcaption>
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch3/ch-3-sync-and-cordn-s69-061.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch3/ch-3-sync-and-cordn-s69-061.webp" alt="Election Algorithm: Basic Concepts (2)" width="536" height="437" loading="lazy" decoding="async">
<figcaption>Election Algorithm: Basic Concepts (2)</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>The Bully algorithm</h3>

<p class="ref-meta">From <em>Ch_3_Sync_and_Cordn.pptx</em>, slides 76&ndash;78 and 84 &mdash; the teacher marks these slides, so the pictures are kept here and the notes keep the section itself, because the syllabus names it.</p>

<!-- dcc-fig:ch3/ch-3-sync-and-cordn-s76-062.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch3/ch-3-sync-and-cordn-s76-062.webp" alt="Bully Algorithm: Detailed Algorithm" width="716" height="252" loading="lazy" decoding="async">
<figcaption>Bully Algorithm: Detailed Algorithm</figcaption>
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch3/ch-3-sync-and-cordn-s77-063.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch3/ch-3-sync-and-cordn-s77-063.webp" alt="Illustration from the teacher's reference material" width="760" height="386" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch3/ch-3-sync-and-cordn-s78-064.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch3/ch-3-sync-and-cordn-s78-064.webp" alt="Illustration from the teacher's reference material" width="777" height="538" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch3/ch-3-sync-and-cordn-s84-069.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch3/ch-3-sync-and-cordn-s84-069.webp" alt="Illustration from the teacher's reference material" width="616" height="426" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->
`,
  slides: `
<h2>The teacher's slides for this unit</h2>
<p class="ref-intro">These are the pictures that came with this unit &mdash; the class deck, the reference notes and the pages handed out with them &mdash; collected here so that the notes above read as writing rather than as a pile of screenshots. Each group is headed by the section of the notes its pictures belong to, in that order, and names the file and the slides they came from. The diagrams the notes themselves need are drawn in the notes.</p>

<h3>3.1 Clock Synchronization: Cristian's Algorithm, NTP</h3>

<p class="ref-meta">From <em>Ch_3_Sync_and_Cordn.pptx</em>, slides 12 and 18.</p>

<!-- dcc-fig:ch3/ch-3-sync-and-cordn-s12-042.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch3/ch-3-sync-and-cordn-s12-042.webp" alt="Physical Clock Synchronization" width="1600" height="1188" loading="lazy" decoding="async">
<figcaption>Physical Clock Synchronization</figcaption>
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch3/ch-3-sync-and-cordn-s18-043.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch3/ch-3-sync-and-cordn-s18-043.webp" alt="Physical Clock Synchronization" width="1600" height="1188" loading="lazy" decoding="async">
<figcaption>Physical Clock Synchronization</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>Logical clocks — the idea</h3>

<p class="ref-meta">From <em>Ch_3_Sync_and_Cordn.pptx</em>, slide 32.</p>

<!-- dcc-fig:ch3/ch-3-sync-and-cordn-s32-045.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch3/ch-3-sync-and-cordn-s32-045.webp" alt="Lamport’s Logical Clocks" width="1335" height="564" loading="lazy" decoding="async">
<figcaption>Lamport’s Logical Clocks</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>Lamport's algorithm</h3>

<p class="ref-meta">From <em>Ch_3_Sync_and_Cordn.pptx</em>, slide 34.</p>

<!-- dcc-fig:ch3/ch-3-sync-and-cordn-s34-046.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch3/ch-3-sync-and-cordn-s34-046.webp" alt="Example: Lamport’s Algorithm" width="1600" height="554" loading="lazy" decoding="async">
<figcaption>Example: Lamport’s Algorithm</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>Vector clocks</h3>

<p class="ref-meta">From <em>Ch_3_Sync_and_Cordn.pptx</em>, slides 43 and 45&ndash;46.</p>

<!-- dcc-fig:ch3/ch-3-sync-and-cordn-s43-047.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch3/ch-3-sync-and-cordn-s43-047.webp" alt="Illustration for Vector clocks" width="547" height="334" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch3/ch-3-sync-and-cordn-s45-048.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch3/ch-3-sync-and-cordn-s45-048.webp" alt="Vector Clock: Example" width="735" height="407" loading="lazy" decoding="async">
<figcaption>Vector Clock: Example</figcaption>
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch3/ch-3-sync-and-cordn-s46-049.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch3/ch-3-sync-and-cordn-s46-049.webp" alt="Illustration for Vector clocks" width="551" height="371" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>The four requirements</h3>

<p class="ref-meta">From <em>Ch_3_Sync_and_Cordn.pptx</em>, slide 52.</p>

<!-- dcc-fig:ch3/ch-3-sync-and-cordn-s52-051.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch3/ch-3-sync-and-cordn-s52-051.webp" alt="Illustration for The four requirements" width="1028" height="614" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>Ricart–Agrawala — the syllabus's named non-token algorithm</h3>

<p class="ref-meta">From <em>Ch_3_Sync_and_Cordn.pptx</em>, slides 55&ndash;57.</p>

<!-- dcc-fig:ch3/ch-3-sync-and-cordn-s55-052.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch3/ch-3-sync-and-cordn-s55-052.webp" alt="Illustration for Ricart–Agrawala — the syllabus's named non-token algorithm" width="1086" height="683" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch3/ch-3-sync-and-cordn-s56-053.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch3/ch-3-sync-and-cordn-s56-053.webp" alt="Illustration for Ricart–Agrawala — the syllabus's named non-token algorithm" width="1028" height="693" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch3/ch-3-sync-and-cordn-s57-054.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch3/ch-3-sync-and-cordn-s57-054.webp" alt="Ricart-Agrawala worked through: P1 and P2 both request the resource, timestamps (11,1) and (15,2)…" width="701" height="281" loading="lazy" decoding="async">
<figcaption>Ricart-Agrawala worked through: P1 and P2 both request the resource, timestamps (11,1) and (15,2)…</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>Token-based algorithms and the Token Ring</h3>

<p class="ref-meta">From <em>Ch_3_Sync_and_Cordn.pptx</em>, slides 59 and 61&ndash;64.</p>

<!-- dcc-fig:ch3/ch-3-sync-and-cordn-s59-055.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch3/ch-3-sync-and-cordn-s59-055.webp" alt="Illustration for Token-based algorithms and the Token Ring" width="1027" height="487" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch3/ch-3-sync-and-cordn-s62-057.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch3/ch-3-sync-and-cordn-s62-057.webp" alt="Token Ring Algorithm" width="410" height="427" loading="lazy" decoding="async">
<figcaption>Token Ring Algorithm</figcaption>
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch3/ch-3-sync-and-cordn-s61-056.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch3/ch-3-sync-and-cordn-s61-056.webp" alt="Illustration for Token-based algorithms and the Token Ring" width="626" height="383" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch3/ch-3-sync-and-cordn-s63-058.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch3/ch-3-sync-and-cordn-s63-058.webp" alt="Token Ring Algorithm" width="621" height="392" loading="lazy" decoding="async">
<figcaption>Token Ring Algorithm</figcaption>
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch3/ch-3-sync-and-cordn-s64-059.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch3/ch-3-sync-and-cordn-s64-059.webp" alt="Token Ring Algorithm" width="622" height="560" loading="lazy" decoding="async">
<figcaption>Token Ring Algorithm</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>The Bully algorithm</h3>

<p class="ref-meta">From <em>Ch_3_Sync_and_Cordn.pptx</em>, slides 79&ndash;80.</p>

<!-- dcc-fig:ch3/ch-3-sync-and-cordn-s79-065.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch3/ch-3-sync-and-cordn-s79-065.webp" alt="Bully Algorithm: Example (2)" width="1127" height="416" loading="lazy" decoding="async">
<figcaption>Bully Algorithm: Example (2)</figcaption>
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch3/ch-3-sync-and-cordn-s80-066.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch3/ch-3-sync-and-cordn-s80-066.webp" alt="Bully Algorithm: Example (2)" width="746" height="393" loading="lazy" decoding="async">
<figcaption>Bully Algorithm: Example (2)</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>The Ring algorithm (Chang and Roberts)</h3>

<p class="ref-meta">From <em>Ch_3_Sync_and_Cordn.pptx</em>, slide 83.</p>

<!-- dcc-fig:ch3/ch-3-sync-and-cordn-s83-067.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch3/ch-3-sync-and-cordn-s83-067.webp" alt="Pi" width="608" height="369" loading="lazy" decoding="async">
<figcaption>Pi</figcaption>
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch3/ch-3-sync-and-cordn-s83-068.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch3/ch-3-sync-and-cordn-s83-068.webp" alt="Pi" width="755" height="552" loading="lazy" decoding="async">
<figcaption>Pi</figcaption>
</figure>
<!-- /dcc-fig -->
`,
  quiz: [
    {
      q: 'In Cristian\'s algorithm, what does the client set its clock to?',
      options: [
        'T, the timestamp the server sent',
        'T + RTT/2, where RTT is the round-trip time of its own request',
        'T &minus; RTT, correcting for the reply delay',
        'The average of T and the client\'s own clock'
      ],
      answer: 1,
      explanation: 'The server appends the time T from its own clock, and the client sets its time to T + RTT/2. The method assumes the RTT is split equally between request and response — a reasonable assumption on a LAN — and its accuracy is ±RTT/2, improved to (RTT/2 − min) by keeping the response with the shortest RTT.'
    },
    {
      q: 'A Cristian\'s-algorithm client sends its request at 5:08:15.100 and receives the reply at 5:08:15.900; the reply carried 5:09:25.300. What should it set its clock to?',
      options: [
        '5:09:25.300',
        '5:08:15.900',
        '5:09:25.700',
        '5:09:24.900'
      ],
      answer: 2,
      explanation: 'RTT = 5:08:15.900 − 5:08:15.100 = 800 ms, so the timestamp is estimated to be 400 ms old: clock = 5:09:25.300 + 400 ms = 5:09:25.700. This is the worked example the algorithm is taught with.'
    },
    {
      q: 'The accuracy of Cristian\'s algorithm, when min is the minimum one-way transmission time, is:',
      options: [
        'RTT/2',
        'RTT &minus; min',
        'RTT/2 &minus; min',
        'min'
      ],
      answer: 2,
      explanation: 'The server\'s time when the message reaches the client lies in the range (T + min) to (T + RTT − min); that range is (RTT − 2·min) wide, which gives an accuracy of (RTT/2 − min).'
    },
    {
      q: 'How long is an NTP timestamp, and what does it represent?',
      options: [
        'A 32-bit count of seconds since 1 Jan 1970 with millisecond resolution',
        'A 64-bit timestamp in UTC seconds since 1 Jan 1900 with a resolution of 200 picoseconds',
        'A 64-bit count of microseconds since the machine booted',
        'A 128-bit UUID with a sequence number'
      ],
      answer: 1,
      explanation: 'Time servers listen on port 123 and reply with a UDP/IP packet in NTP format: a 64-bit timestamp in UTC seconds since 1 Jan 1900 with 200 picosecond resolution. This is the label that came with the NTP material.'
    },
    {
      q: 'Which NTP mode is used to synchronize between the time servers themselves?',
      options: [
        'Multicast',
        'Remote procedure call',
        'Symmetric mode',
        'Broadcast'
      ],
      answer: 2,
      explanation: 'Symmetric mode gives high accuracy and is used peer-to-peer between time servers. Multicast is for quick LANs at low accuracy, and the RPC mode — where the server replies to a client request with its timestamp — gives medium accuracy and is the one like Cristian\'s algorithm.'
    },
    {
      q: 'In the NTP exchange where A sends at T1, B receives at T2, B responds at T3 and A receives at T4, the offset is:',
      options: [
        '(T4 &minus; T1) &minus; (T3 &minus; T2)',
        '[(T2 &minus; T1) + (T3 &minus; T4)] / 2',
        'T3 &minus; T1',
        '(T4 &minus; T3) / 2'
      ],
      answer: 1,
      explanation: 'The total transit time is (T4 − T1) − (T3 − T2) — elapsed time minus the server\'s processing time — and half of it is the one-way delay. Substituting that gives B\'s clock at T4 as [(T4 − T1) + (T2 + T3)]/2, so the difference θ = [(T2 − T1) + (T3 − T4)]/2.'
    },
    {
      q: 'Which statement about Lamport timestamps is TRUE?',
      options: [
        'If ts(a) < ts(b) then a happened before b',
        'If a happened before b then ts(a) < ts(b)',
        'Lamport timestamps can detect whether two events are concurrent',
        'Lamport timestamps give the real time of each event'
      ],
      answer: 1,
      explanation: 'The implication runs one way only. a → b implies ts(a) < ts(b), but ts(a) < ts(b) does not prove a → b — concurrent events can carry any two values. Detecting genuine concurrency is exactly what vector clocks add.'
    },
    {
      q: 'On receiving a message, a process using Lamport\'s algorithm sets its counter to:',
      options: [
        'its own value plus one',
        'the received value plus one',
        'one more than the maximum of its own value and the received value',
        'the maximum of its own value and the received value'
      ],
      answer: 2,
      explanation: 'Rule 3 of Lamport\'s algorithm: the receiver sets its counter to be greater than the maximum of its own value and the received value before it considers the message received. That is what "resynchronizes its logical clock with that sender" means.'
    },
    {
      q: 'Why are vector clocks needed in addition to Lamport timestamps?',
      options: [
        'Because Lamport timestamps cannot be stored in 32 bits',
        'Because Lamport timestamps give false positives — LC(e1) < LC(e2) can hold for concurrent events, so concurrent updates may be ordered unnecessarily',
        'Because Lamport timestamps require synchronized physical clocks',
        'Because vector clocks use less memory'
      ],
      answer: 1,
      explanation: 'The converse of the clock condition does not hold for Lamport clocks, so a smaller timestamp does not mean "happened before". Vector clocks are necessary and sufficient for capturing causality: two non-dominating vectors prove the events are concurrent.'
    },
    {
      q: 'The improvement in Ricart-Agrawala over Lamport\'s mutual exclusion algorithm is:',
      options: [
        'It uses a token instead of messages',
        'A node with a lower request timestamp need not send a REPLY, since the requester cannot enter before it anyway',
        'It requires FIFO channels, which makes it faster',
        'It elects a coordinator and asks only that node'
      ],
      answer: 1,
      explanation: 'That is the stated main idea: node j need not send a REPLY to node i if j has a request with a lower timestamp than i\'s request. The properties are 2(n−1) messages per critical-section invocation, no FIFO requirement, a synchronization delay of one maximum message transmission time, and requests granted in increasing timestamp order.'
    },
    {
      q: 'In the Token Ring mutual exclusion algorithm, when a process receives the token but does not need the critical section, it:',
      options: [
        'holds the token until it needs it',
        'immediately passes the token on along the ring',
        'destroys the token so it can be regenerated later',
        'sends a reply message to the last requester'
      ],
      answer: 1,
      explanation: 'A process that wants the section waits for the token from its left neighbour and retains it; after leaving the section it passes the token clockwise. A process that does not want it passes it on immediately — which is why the ring carries traffic even when nobody needs the section, and why the algorithm works poorly under light load.'
    },
    {
      q: 'What has to happen if the process holding the token fails in the Token Ring algorithm?',
      options: [
        'Nothing — the token is duplicated automatically',
        'A unique process has to be picked to regenerate the token, which requires running an election algorithm',
        'The whole system must be restarted',
        'The ring must be rebuilt physically'
      ],
      answer: 1,
      explanation: 'If a process fails, no progress can be made until a reconfiguration extracts it from the ring; if the token holder fails, a unique process must be picked to regenerate the token and pass it along — an election algorithm has to be run for that purpose. This is the direct link between mutual exclusion and election algorithms.'
    },
    {
      q: 'In the Bully algorithm, why is a process with a higher ID able to displace an existing coordinator?',
      options: [
        'Because it has a faster clock',
        'Because a recovered or higher-numbered process immediately begins the algorithm and forces lower-numbered processes to let it become coordinator, even if one is already active',
        'Because the current coordinator resigns on receiving any election message',
        'Because the time-out T is shorter for higher-numbered processes'
      ],
      answer: 1,
      explanation: 'After a failed process recovers it immediately begins execution of the algorithm, and if there are no active processes with higher numbers it forces all lower-numbered processes to let it become coordinator — even if there is currently an active coordinator with a lower number. That is how the algorithm gets its name.'
    },
    {
      q: 'Which message types does the Bully algorithm use?',
      options: [
        'REQUEST, REPLY, RELEASE',
        'Election, Answer, Coordinator',
        'Token, Elected, Coordinator',
        'Probe, Ack, Broadcast'
      ],
      answer: 1,
      explanation: 'Election (announce an election), Answer (respond to an election — the "I am alive" reply) and Coordinator (announce the elected process). REQUEST/REPLY belong to Ricart-Agrawala, and the Ring algorithm uses election and elected/coordinator messages that accumulate ids.'
    },
    {
      q: 'What is the two-phase structure that every election algorithm shares?',
      options: [
        'First detect a failure, then broadcast a time-out',
        'First select the leader with the highest priority, then inform all processes about the winner',
        'First build the ring, then circulate the token',
        'First request permission from all nodes, then enter the critical section'
      ],
      answer: 1,
      explanation: 'An election process is typically performed in two phases: select a leader with the highest priority, then inform all processes about the winner. The Ring algorithm makes this explicit — one lap with the election message, one lap with the coordinator message.'
    },
    {
      q: 'Which is an advantage of the Ring (Chang and Roberts) election algorithm over Bully?',
      options: [
        'It elects the coordinator faster in all cases',
        'It does not require any process to know how many processes are in the ring',
        'It does not need process identifiers',
        'It works without any messages'
      ],
      answer: 1,
      explanation: 'Chang and Roberts works for any number of processes N and does not require any process to know how many are in the ring, and it needs only unidirectional links. Bully assumes a system where every process can send a message to every other process and each knows who has a higher identifier.'
    }
  ],

  past: [
    {
      year: 'Final 2025',
      marks: '2',
      repeats: 1,
      q: 'List any two mutual exclusion algorithms.',
      occ: [
        { year: 'Final 2025', marks: '2', q: 'List any two mutual exclusion algorithms.' }
      ],
      answer: `
<h4>Model answer &mdash; 2 marks</h4>
<p>Any two of the classic distributed mutual-exclusion algorithms earn the marks. The
three that are examinable here, with one line each:</p>
<ul>
<li><strong>Centralized (coordinator) algorithm</strong> &mdash; one process holds the token. A
process wanting the critical section sends a request to the coordinator and waits for the
token; the coordinator grants it to one process at a time and queues the rest. Simple,
but the coordinator is a single point of failure and a bottleneck.</li>
<li><strong>Ricart&ndash;Agrawala (distributed, timestamp-based)</strong> &mdash; there is no
coordinator. A process broadcasts a request stamped with its Lamport time and enters only
when every other process has replied. A process defers its reply if it is itself waiting
and its own request has a smaller timestamp, which is where the total ordering does the
work.</li>
<li><strong>Token-ring (ring) algorithm</strong> &mdash; the N processes form a logical ring
and one token circulates; holding the token is permission to enter. It needs no
coordination traffic when idle, but a lost token stops progress until it is regenerated.</li>
</ul>
<div class="concept-box tip">
<h4>What earns the second mark</h4>
<p>Naming two is the first mark. The second comes from one clause that shows you know what
the algorithm <em>does</em> rather than which word it is &mdash; "the coordinator is a single
point of failure" or "requests are ordered by Lamport timestamp" is enough. This was Group A
question 2 of the <em>2025 Final Exam</em>, worth 2 marks, so it is a one-line answer and the
cheapest mark on this unit's part of that paper.</p>
</div>
`
    },
    {
      year: 'Model 2025',
      marks: '2',
      repeats: 1,
      q: 'List any two clock synchronization algorithms used in distributed systems.',
      occ: [
        { year: 'Model 2025', marks: '2', q: 'List any two clock synchronization algorithms used in distributed systems.' }
      ],
      answer: `
<h4>Model answer &mdash; 2 marks</h4>
<p>Clock synchronization algorithms fall into two families, and either pair below is a correct answer:</p>
<ul>
<li><strong>Physical clock synchronization</strong> &mdash; the clocks themselves are moved toward real time (UTC):
  <ul>
  <li><strong>Cristian's algorithm</strong> (centralized): the client requests the time from a time server, which appends its own timestamp T, and the client sets its clock to <strong>T + RTT/2</strong>.</li>
  <li><strong>Network Time Protocol (NTP)</strong> (distributed): servers listen on port 123 and reply with a 64-bit timestamp; clients average updates from several servers and the protocol arranges servers in strata.</li>
  </ul>
</li>
<li><strong>Logical clock synchronization</strong> &mdash; no physical time, only causal order:
  <ul>
  <li><strong>Lamport timestamps</strong>: a monotonically increasing software counter, incremented at each event and carried on messages, resynchronized by the receiver to one more than the maximum of the two values.</li>
  <li><strong>Vector clocks</strong>: an array of N logical clocks, one per process, exchanged in full with every message, which detects genuine concurrency.</li>
  </ul>
</li>
</ul>
<p>Two from either family is a complete answer; naming both families and one algorithm from each is stronger and costs one extra line.</p>

<div class="concept-box tip">
<h4>Where this came from</h4>
<p>Group A, question 3 of the <em>Model Question 2025</em>. Group A questions are 2 marks each (<code>2*4 = 8</code>), so this expects two names, not an explanation &mdash; but the two families are the distinction the syllabus draws in 3.1 and 3.2, so showing it is cheap and safe.</p>
</div>`
    },
    {
      year: 'Model 2025',
      marks: '4',
      repeats: 1,
      q: "Explain Lamport's logical clock with a suitable example.",
      occ: [
        { year: 'Model 2025', marks: '4', q: "Explain Lamport's logical clock with a suitable example." }
      ],
      answer: `
<h4>Model answer &mdash; 4 marks</h4>
<p><strong>Why it is needed.</strong> There is no common memory and no common clock in a distributed system, so it is sometimes impossible to say which of two events occurred first. Physical clocks drift and cannot be synchronised perfectly. A <strong>logical clock</strong> &mdash; invented by Lamport (1978) &mdash; is a mechanism by which the <strong>happened-before ordering is captured numerically</strong>. It is a <strong>monotonically increasing software counter whose value need bear no particular relationship to any physical clock</strong>: it is adequate that all machines agree it is 10:00 even if it is really 10:02, because what matters is internal consistency, not closeness to real time.</p>

<p><strong>Definition of happened-before.</strong> A &rarr; B if A and B are in the same process and A executed first; A &rarr; B if A is the sending of a message and B its receipt; and the relation is transitive. Events not related by &rarr; are <strong>concurrent</strong>. A timestamping scheme must guarantee that <strong>if A &rarr; B then ts(A) &lt; ts(B)</strong>.</p>

<p><strong>The algorithm.</strong> Each process p<sub>i</sub> keeps its own counter L<sub>i</sub>:</p>
<ol>
<li><strong>A process increments its counter before each event in that process.</strong></li>
<li><strong>When a process sends a message, it includes its counter value with the message.</strong></li>
<li><strong>On receiving a message, the receiver sets its counter to be greater than the maximum of its own value and the received value, before it considers the message received.</strong></li>
</ol>
<p>Conceptually the clock has meaning only in relation to messages moving between processes: when a process receives a message it <strong>resynchronizes its logical clock with that sender</strong>. In the middleware, the local clock is adjusted and the message timestamped before the network layer sends it.</p>

<p><strong>Example.</strong> Three processes p1, p2, p3 (Fig 3.2). p1 performs an event (counter 1), then another (counter 2) and sends a message carrying 2; p2, whose counter is 1, receives it and sets its counter to <strong>max(1, 2) + 1 = 3</strong>; p2 sends a message carrying 3 to p3, which sets its counter to <strong>max(1, 3) + 1 = 4</strong>, and so on. Every counter along a process increases, and each receive event carries a value strictly greater than the message's value &mdash; so rule 2 of happened-before is satisfied numerically.</p>

<p><strong>The limitation (needed for full marks).</strong> The guarantee is one-directional: <strong>ts(A) &lt; ts(B) does not imply A &rarr; B</strong>. Two concurrent events can carry 3 and 7 with no causal link. So Lamport clocks give a consistent total order, but they <strong>do not capture causality violations</strong> &mdash; if we know A &rarr; C and B &rarr; C we cannot say which of A or B initiated C, which matters when replaying events to recover a node after a crash. Two practical requirements follow: the clock must tick at least once between two events of the same process so that <code>C(a)</code> never equals <code>C(b)</code>, and in a multithreaded environment the process ID should be attached to the timestamp.</p>

<div class="concept-box tip">
<h4>Where this came from</h4>
<p>Group B, question 8 of the <em>Model Question 2025</em>, worth 4 marks. The question says "with a suitable example", so the example is compulsory — draw the three-process timeline and label the counter values, then state the one-directional limitation. The limitation is what most answers omit.</p>
</div>`
    },
    {
      year: 'Model 2025',
      marks: '8',
      repeats: 2,
      q: 'Describe in detail the working and applications of the Bully election algorithm.',
      occ: [
        { year: 'Model 2025', marks: '8', q: 'Describe in detail the working and applications of the Bully election algorithm.' },
        { year: 'Final 2025', marks: '8', q: 'Explain the Bully Election Algorithm with an example and event sequence.' }
      ],
      answer: `
<h4>Model answer &mdash; 8 marks</h4>
<p><strong>1. Purpose.</strong> In distributed computing, <strong>leader election is the process of designating a single process as the organizer of a task distributed among several nodes</strong>. Before the task begins, no node knows which will lead; after the algorithm has run, <strong>every node recognizes the same unique node as leader</strong>. The Bully algorithm is <strong>a method for dynamically selecting a coordinator by process ID number</strong>, applicable to a system in which <strong>every process can send a message to every other process</strong> (a mesh, for example).</p>

<p><strong>2. Assumptions.</strong> The system is <strong>synchronous</strong>, and <strong>failure is detected by time-out</strong>. A <strong>unique priority number</strong> is associated with each active process (process P<sub>i</sub> has number <em>i</em>), there is a one-to-one correspondence between processes and sites, and <strong>the coordinator is always the active process with the largest priority number</strong>. It does not matter <em>which</em> process is elected; what matters is that <strong>exactly one is chosen and all processes agree on the decision</strong>. Each process knows which processes have higher identifiers and communicates with them.</p>

<p><strong>3. Message types.</strong> <strong>Election</strong> (sent to announce an election), <strong>Answer</strong> (sent to respond to an election message) and <strong>Coordinator</strong> (sent to announce the identity of the elected process).</p>

<p><strong>4. Working &mdash; basic steps.</strong> When a process P determines that the current coordinator is down, because of message time-outs or a failure to initiate a handshake:</p>
<ol>
<li><strong>P broadcasts an election message (inquiry) to all other processes with higher process IDs.</strong></li>
<li><strong>If P hears from no process with a higher ID than itself, it wins the election and broadcasts victory.</strong></li>
<li><strong>If P hears from a process with a higher ID, P waits a certain time for that process to broadcast itself as leader. If that message does not arrive in time, P re-broadcasts the election message.</strong></li>
<li><strong>If P receives an election message from a process with a lower ID, it sends an "I am alive" answer and starts a new election.</strong></li>
</ol>

<p><strong>5. The detailed rules with the two time-outs.</strong> If P<sub>i</sub>'s request is not answered by the coordinator within interval <strong>T</strong>, it assumes the coordinator has failed and attempts to elect itself: it sends an election message to every process with a higher number and <strong>waits for an answer within T</strong>. If no response comes within T, it assumes every higher-numbered process has failed and <strong>elects itself coordinator</strong>. If an answer is received, it starts interval <strong>T&prime;</strong> waiting for news that a higher-numbered process has been elected; if nothing arrives within T&prime;, it restarts the algorithm. Meanwhile, if it receives "P<sub>j</sub> is the new coordinator (j &gt; i)" it records it; if it receives "P<sub>j</sub> started an election (j &gt; i)" it answers and begins its own election, provided it has not already started one.</p>

<p><strong>6. Worked example (Fig 3.3).</strong> Six processes P0&ndash;P5; the coordinator fails. <strong>P2 initiates an election</strong> and receives replies from P3 and P4; <strong>P3 and P4 each initiate their own elections</strong>; P3 receives a reply, but <strong>P4 receives no reply from P5 (which is down) and announces itself coordinator</strong>. With the deck's other example: process 4 holds an election, 5 and 6 respond and tell 4 to stop, 5 and 6 each hold an election, <strong>6 tells 5 to stop, 6 wins and tells everyone</strong>.</p>

<p><strong>7. Why it is called the Bully algorithm.</strong> Because <strong>if a process receives a victory message from a process with a lower ID number, it immediately initiates a new election</strong>: a process with a higher number <strong>bullies</strong> a lower-numbered process out of the coordinator position as soon as it comes online. Correspondingly, <strong>after a failed process recovers it immediately begins the same algorithm</strong>, and <strong>if there is no active process with a higher number it forces all lower-numbered processes to let it become coordinator, even if there is currently an active coordinator with a lower number</strong>.</p>

<p><strong>8. Applications.</strong> Every distributed algorithm that needs one process to act as coordinator uses an election:</p>
<ul>
<li><strong>Clock synchronization</strong> &mdash; the Berkeley algorithm needs a leader or master to take responsibility for averaging the time.</li>
<li><strong>Mutual exclusion</strong> &mdash; the <em>central coordinator based</em> algorithm needs a new coordinator elected at initialization or <strong>whenever the coordinator crashes</strong>; the <em>token ring</em> algorithm needs one when <strong>the process holding the token fails</strong>, so that a unique process regenerates the token.</li>
<li><strong>Any distributed computing</strong> &mdash; a distributed algorithm does not assume the existence of a central coordinator, so a master must be selected to <strong>distribute sub-problems among the slaves and collect the partial results</strong>.</li>
<li>In practice the same mechanism is what a replicated service uses to pick its primary, and what a distributed system uses after a crash to decide where a new copy of the coordinator should be restarted.</li>
</ul>

<p><strong>9. Contrast in one line (optional).</strong> The Ring (Chang and Roberts) algorithm is the alternative: it assumes only a logical ring with unidirectional links, needs no process to know how many processes exist, circulates one election message that accumulates identifiers, and repeats the election if the chosen candidate turns out to have failed.</p>

<div class="concept-box tip">
<h4>Where this came from</h4>
<p>Group C, question 14 of the <em>Model Question 2025</em>, worth 8 marks &mdash; Group C questions carry two parts of 4 marks each, and this one asks for two things: the <strong>working</strong> and the <strong>applications</strong>. Answer in that shape, with Fig 3.3 drawn for the example and the four applications listed by name.</p>
</div>`
    }
  ]
};
