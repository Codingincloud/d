/* Chapter 1 — Introduction to Distributed Systems.

   Syllabus unit 1: 4 hours, 6 marks. Sub-topics 1.1 Definition and
   characteristics, 1.2 Goals of distributed systems, 1.3 Examples: Google File
   System, Hadoop, BitTorrent, etc., 1.4 Models: Client-server, Peer-to-peer,
   Multitier.

   Everything here is written from the course's own material, which is read
   into `_source/dcc/` by tools/dcc_extract.py:

     lecture_notes_all_chapterwise_chapter1_int_to_distbd_sys.txt
         Er. Avijit Karn's 26-slide Chapter 1 deck (1.1-1.9)

     gfs_hdfs_lecture.txt, hdfs_note_4std_lecture.txt
         the GFS/HDFS lectures, which are what sub-topic 1.3 names

     syllabus_distbd_cloudcomptng.txt
         the unit list, the hours, the marks table and the Model Question 2025

   Where a fact comes from a recommended textbook rather than the deck it says
   so in the text, because the deck is 26 slides and the syllabus expects the
   books to be read alongside it. */

window.CHAPTERS = window.CHAPTERS || {};
window.CHAPTERS[1] = {
  learn: `

<h2>Unit 1 &mdash; Introduction to Distributed Systems</h2>
<p class="unit-meta">Syllabus: 4 hours &middot; 6 marks &middot; sub-topics 1.1&ndash;1.4</p>

<h2>1.1 Definition and characteristics</h2>

<div class="concept-box key">
<h4>Definition</h4>
<p>A <strong>distributed system</strong> is a collection of <em>autonomous computing elements</em> that appears to its users as a <em>single coherent system</em>. <span class="src">(Tanenbaum &amp; Van Steen)</span></p>
<p>A system in which hardware or software components located at networked computers communicate and coordinate their actions <em>only by passing messages</em>. <span class="src">(Coulouris et al.)</span></p>
<p><em>Distributed system = autonomous nodes + message passing + one coherent system.</em></p>
</div>
<p>The definition carries three parts:</p>
<ul>
<li><strong>Autonomous elements</strong> &mdash; every node keeps its own clock, holds its own state, decides for itself and can fail on its own.</li>
<li><strong>Message passing</strong> &mdash; components communicate and coordinate only by sending messages over a network; there is no shared memory and no shared clock.</li>
<li><strong>One coherent system</strong> &mdash; the user sees a single system rather than a set of machines, and does not need to know which machine holds a file or how many machines are involved.</li>
</ul>
<h3>The three characteristics the definition implies</h3>
<p>The definition forces three characteristics. Every mechanism later in the subject exists to cope with one of them.</p>

<table class="comparison-table">
<thead>
<tr><th>Characteristic</th><th>What it means</th><th>What it leads to</th></tr>
</thead>
<tbody>
<tr>
<td><strong>Concurrency</strong></td>
<td>Programs on different machines share resources and execute at the same time, which reduces latency and increases throughput.</td>
<td>Two nodes may want the same resource at the same moment, which is what mutual exclusion solves.</td>
</tr>
<tr>
<td><strong>No global clock</strong></td>
<td>Each machine keeps its own time and there is no single universal time. Synchronisation over a network is difficult, and coordination depends on messages arriving.</td>
<td>Cristian's algorithm and NTP bring the clocks close together; Lamport's clocks and vector clocks order events when the clocks cannot be made exact.</td>
</tr>
<tr>
<td><strong>Independent failures</strong></td>
<td>Any single component can fail without bringing the system down. The system must tolerate <em>partial failure</em>: part of it is broken while the rest keeps working.</td>
<td>Replication and consistency between copies, and the failure model set out under Fundamental models.</td>
</tr>
</tbody>
</table>
<h3>Further characteristics</h3>
<p>A distributed system is also expected to have these properties:</p>

<table class="comparison-table">
<thead>
<tr><th>Characteristic</th><th>Explanation</th><th>Example</th></tr>
</thead>
<tbody>
<tr><td><strong>Heterogeneity</strong></td><td>Components differ in network, hardware architecture, operating system, programming language and implementation, and still have to work together.</td><td>A Windows client calling a Linux service over HTTP.</td></tr>
<tr><td><strong>Openness</strong></td><td>The system offers services through published, standard interfaces so components can be added and removed without disrupting the rest.</td><td>REST APIs, so any platform can integrate.</td></tr>
<tr><td><strong>Security</strong></td><td>Confidentiality, integrity and availability must all hold, and they are harder here because parts travel over networks nobody controls.</td><td>Encryption, authentication, authorisation.</td></tr>
<tr><td><strong>Scalability</strong></td><td>The system keeps working as it grows &mdash; in size, in geography and in administration.</td><td>Adding servers for a sale event.</td></tr>
<tr><td><strong>Transparency</strong></td><td>Internals are hidden: separate machines look like one.</td><td>A remote file read over NFS feels local.</td></tr>
<tr><td><strong>Fault tolerance</strong></td><td>Failures are masked and the system recovers from errors.</td><td>One search replica dies; search still answers.</td></tr>
</tbody>
</table>
<h3>Advantages and disadvantages</h3>
<p>Each advantage has its price on the other side of the same property: sharing is the advantage and the security exposure is its cost, scalability is the advantage and fault-finding across many nodes is its cost.</p>

<table class="comparison-table">
<thead>
<tr><th>Advantages</th><th>Disadvantages</th></tr>
</thead>
<tbody>
<tr><td><strong>Economics</strong><br><span class="muted">A collection of microprocessors gives better price/performance than a single large machine.</span></td><td><strong>Security</strong><br><span class="muted">It is the main concern &mdash; every connection and every node has to be secured, and there are more of them.</span></td></tr>
<tr><td><strong>Scalable</strong><br><span class="muted">Capacity can be added a machine at a time.</span></td><td><strong>Loss of data</strong><br><span class="muted">It is possible while data moves across nodes.</span></td></tr>
<tr><td><strong>Sharing</strong><br><span class="muted">Data and resources, hardware and software both.</span></td><td><strong>Complexity</strong><br><span class="muted">Developing software for a distributed system is much higher than for one machine.</span></td></tr>
<tr><td><strong>Flexibility</strong><br><span class="muted">The workload can be spread over the connected machines.</span></td><td><strong>Distribution of control</strong><br><span class="muted">Administration becomes difficult, and faults are harder to detect because no one node sees the whole system.</span></td></tr>
<tr><td><strong>Communication</strong><br><span class="muted">Fast, reliable, and inherently distributed among users.</span></td><td></td></tr>
<tr><td><strong>Availability</strong><br><span class="muted">And incremental growth: computing power can be added in small increments rather than in one large step.</span></td><td></td></tr>
</tbody>
</table>

<p>Two rows carry the most weight. Economics is the commercial argument for distributing a system, and distribution of control is the hardest row, because its obstacles are organisational and human rather than technical.</p>

<h2>1.2 Goals of distributed systems</h2>

<p>Four design goals have to be met: resource sharing, openness, transparency and scalability. Each answers a different question &mdash; what the system shares, how others build on it, what it hides, and how it grows.</p>

<div class="concept-box key">
<h4>Goal 1 &mdash; Resource sharing</h4>
<p>Sharing of available physical or non-physical resources &mdash; remote data, files, printers, processors, storage &mdash; in an efficient manner. It is the main motivation for building a distributed system in the first place.</p>
<ul>
<li><strong>Cost-effective implementation</strong> &mdash; pooled resources cost less than equipping every node on its own.</li>
<li><strong>Collaboration</strong> &mdash; nodes and users work together and exchange information to do it.</li>
<li><strong>Security cost</strong> &mdash; every shared resource widens the surface that has to be protected.</li>
</ul>
</div>

<div class="concept-box">
<h4>Goal 2 &mdash; Openness</h4>
<p>Services are specified through standard rules, and the syntax and semantics of a service are defined through an interface written in an <strong>IDL (Interface Definition Language)</strong>.</p>
<ul>
<li><strong>What the IDL states</strong> &mdash; the function name, its parameters, its return values, the exceptions it can raise and how the service is used; the interface itself is neutral, committing to no language and no platform.</li>
<li><strong>Interoperability</strong> &mdash; two implementations use each other's services.</li>
<li><strong>Portability</strong> &mdash; an application written for one distributed system works correctly on another that has the same implementations.</li>
<li>Components can be added and removed without affecting the rest of the system.</li>
<li>The first step is publishing the documentation of the components and their interfaces so others can build against them.</li>
</ul>
</div>

<div class="concept-box tip">
<h4>Goal 3 &mdash; Transparency</h4>
<p>A single coherent system is realised by hiding the processes and resources that make it up. Transparency is a family of properties, and each form hides something different:</p>
<table class="comparison-table">
<thead>
<tr><th>Form</th><th>What is hidden</th></tr>
</thead>
<tbody>
<tr><td><strong>Access</strong></td><td>The differences in data representation and the way a resource is accessed &mdash; a local file and a remote file are read the same way.</td></tr>
<tr><td><strong>Location</strong></td><td>Where the resource physically is; the name carries no address.</td></tr>
<tr><td><strong>Migration</strong></td><td>That a resource may move to another location without its name changing.</td></tr>
<tr><td><strong>Relocation</strong></td><td>That a resource may move while it is in use, without the client noticing.</td></tr>
<tr><td><strong>Replication</strong></td><td>That extra copies exist &mdash; the user sees one resource, not three replicas.</td></tr>
<tr><td><strong>Concurrency</strong></td><td>That other users and processes are sharing the same resource.</td></tr>
<tr><td><strong>Failure</strong></td><td>That a component failed and was recovered from &mdash; work is completed despite partial failure.</td></tr>
<tr><td><strong>Persistence</strong></td><td>Whether a resource is stored in memory or on disk.</td></tr>
</tbody>
</table>
</div>
<div class="concept-box warn">
<h4>Goal 4 &mdash; Scalability</h4>
<p>A system is scalable when it can grow without losing what makes it usable. Four things have to be kept under control:</p>
<ul>
<li><strong>Cost of physical resources</strong> &mdash; it should increase linearly with the size of the system, not faster.</li>
<li><strong>Performance loss</strong> &mdash; a system twice the size must not be dramatically slower per operation.</li>
<li><strong>Software resources</strong> &mdash; address space, file descriptors, port numbers and names must not run out.</li>
<li><strong>Bottlenecks</strong> &mdash; the practical answer is decentralised algorithms with no node that everyone must talk to, plus caching and replication, which is how the Web scales.</li>
</ul>
</div>

<h3>Main problems and challenges</h3>
<p>Four problems stand between the system and those goals: heterogeneity, reliability, security and scalability. Heterogeneity is what openness has to overcome, reliability and security cut across every goal, and scalability is a goal under its own name.</p>

<h4>Heterogeneity</h4>
<p>Heterogeneous components have to interoperate, and that applies to networks, hardware architectures, operating systems, programming languages and the programs written in them. Three things mask the differences:</p>

<table class="comparison-table">
<thead>
<tr><th>Mechanism</th><th>What it does</th><th>Reach</th></tr>
</thead>
<tbody>
<tr><td><strong>Middleware</strong></td><td>A software layer providing a programming abstraction that hides the heterogeneity of the networks, hardware, operating systems and languages underneath. Examples: <em>CORBA</em>, <em>ODBC</em>, <em>JDBC</em>, <em>RMI</em>. It supplies services so applications exchange data in a standard way.</td><td>The differences inside one organisation's systems.</td></tr>
<tr><td><strong>Internet protocols</strong></td><td>The common set every node already speaks, so any node can reach any other.</td><td>The whole world, at the price of the lowest common denominator everyone agrees to speak.</td></tr>
<tr><td><strong>Mobile code</strong></td><td>Code travels to the data instead of the data travelling to the code.</td><td>Removes the assumption that a program stays where it was written.</td></tr>
</tbody>
</table>

<h4>Reliability</h4>
<table class="comparison-table">
<thead>
<tr><th>Term</th><th>Meaning</th></tr>
</thead>
<tbody>
<tr><td><strong>Availability</strong></td><td>The fraction of time the system is usable, raised by redundancy &mdash; a spare node, a second copy, a second route.</td></tr>
<tr><td><strong>Reliability</strong></td><td>Running continuously without interruption. A system down for one millisecond every hour is above 99.9999% available and still unreliable; one that never crashes but is shut down for two fixed weeks is highly reliable and only about 96% available.</td></tr>
<tr><td><strong>Fault tolerance</strong></td><td>Failures are masked and the system recovers from errors.</td></tr>
<tr><td><strong>Dependability</strong></td><td>The wider requirement, with four parts: availability, reliability, safety and maintainability.</td></tr>
</tbody>
</table>

<h4>Security</h4>
<p>Security has to fulfil three components &mdash; Confidentiality, Integrity and Availability (the CIA triad): information is disclosed only to those entitled to see it, it is not altered by accident or by an attacker, and the service can be used when it is needed.</p>
<ul>
<li><strong>Encryption</strong> &mdash; a message an eavesdropper captures is unreadable.</li>
<li><strong>Authentication</strong> &mdash; the parties are who they claim to be.</li>
<li><strong>Authorisation</strong> &mdash; an authenticated party may do only what it is permitted to do.</li>
<li><strong>Denial of service</strong> &mdash; the aim is not to read or change anything but to make the service unavailable, an attack on availability directly.</li>
<li><strong>Mobile code security</strong> &mdash; a program arriving from elsewhere runs on the local machine, and the question is what it may touch.</li>
<li><strong>Trust boundary</strong> &mdash; a provider and a tenant trust each other only as far as the contract says.</li>
</ul>

<h4>Scalability</h4>
<p>Scalability is three separate problems, and the third is the hardest because its obstacles are political rather than technical.</p>
<table class="comparison-table">
<thead>
<tr><th>Kind</th><th>The problem</th></tr>
</thead>
<tbody>
<tr><td><strong>Size scalability</strong></td><td>More users or resources have to be supported, which centralised services cannot do because of their own limits.</td></tr>
<tr><td><strong>Geographical scalability</strong></td><td>Users and resources are far apart, so communication delays are unavoidable and designs that assume quick responses stop working.</td></tr>
<tr><td><strong>Administrative scalability</strong></td><td>Several independent organisations share one system without giving up control of their own resources.</td></tr>
</tbody>
</table>
<p>The symptoms are four &mdash; cost of physical resources rising faster than size, loss of performance, software resources running out, and bottlenecks. The treatment has three parts: decentralised algorithms so that no node holds all the state, caching, and replication so that work is done near where it is needed.</p>

<h3>Resource sharing, and what a service is</h3>
<p>Sharing is one of the goals, and it introduces the word <em>service</em>.</p>

<div class="concept-box asked">
<h4>Resource against service</h4>
<p>A <em>resource</em> is the thing itself &mdash; a printer, a file, a search index. A <em>service</em> is the interface that manages a collection of related resources and decides who may use them and how.</p>
</div>
<ul>
<li><strong>Users share resources</strong> &mdash; hardware such as a printer, data such as files, and functionality such as a search engine.</li>
<li><strong>A service manages them</strong> &mdash; file sharing is initiated by a file service offering read, write and delete operations on files, which is why the interface, not the file, is what makes sharing possible.</li>
<li><strong>Remote invocation needs communication</strong> &mdash; services on other computers can only be invoked by passing messages.</li>
</ul>

<h2>1.3 Examples: Google File System, Hadoop, BitTorrent, etc</h2>

<div class="example-box">
<h4>Example: Google File System (GFS)</h4>
<p>What it is: Google's cluster file system &mdash; a single master holds the metadata, files are split into large chunks, and the chunks are replicated across many chunk servers.</p>
<p>How it applies: autonomous nodes cooperate over a network to present one file system, which is the 1.1 definition; it is built on the assumption that components fail, so it treats failure as normal.</p>
</div>
<div class="example-box">
<h4>Example: Hadoop / HDFS</h4>
<p>What it is: the open-source descendant of GFS, with MapReduce alongside it. A NameNode holds the metadata and many DataNodes hold replicated blocks.</p>
<p>How it applies: same shape and same reason &mdash; files look like one system while storage and computation are spread over commodity machines.</p>
</div>
<div class="example-box">
<h4>Example: BitTorrent</h4>
<p>What it is: peer-to-peer file distribution &mdash; a file is split into pieces and every peer that holds pieces also serves them.</p>
<p>How it applies: it follows the peer-to-peer model, with no client and no server, all peers in the same role, and any one computer holding only a small part of the data.</p>
</div>

<p>Applications that motivate distributed systems: web search, finance and commerce, creative industries and entertainment, healthcare, education, transport and logistics, massive online multiplayer games and financial trading. The last two are the demanding ones, because both need low and predictable latency across the world.</p>

<h3>The Web as a distributed system</h3>
<p>The Web's own problems are the distribution problems met in the field:</p>
<ul>
<li><strong>Dangling links</strong> &mdash; a resource is deleted but the links to it remain.</li>
<li><strong>Slow response</strong> &mdash; to web users.</li>
<li><strong>No proper interface</strong> &mdash; the user interface is lacking.</li>
</ul>

<h2>1.4 Models: Client-server, Peer-to-peer, Multitier</h2>

<p>Architecture models describe the <em>placement of the parts and the relationships between them</em>: client-server, peer-to-peer and multitier. Fundamental models describe the properties all architectures share.</p>
<h3>Client-server</h3>
<p>The base pattern, built on a <strong>request/reply</strong> protocol: the client sends a request asking for a service, the server does the work and returns either the result or an error code.</p>
<p>Working mechanism:</p>
<ol>
<li><strong>Request</strong> &mdash; the client sends an invocation message naming the service and its arguments.</li>
<li><strong>Processing</strong> &mdash; the server that owns the service executes it.</li>
<li><strong>Reply</strong> &mdash; the server returns the result or an error code to the client.</li>
</ol>
<p>The exchange is carried out with send/receive primitives, or through <strong>RPC</strong> or <strong>RMI</strong> so that it reads like a local call.</p>

<table class="comparison-table">
<thead>
<tr><th></th><th>Client-server</th></tr>
</thead>
<tbody>
<tr><td><strong>Roles</strong></td><td>The server is a distinguished process that owns the service; the client is any process that needs it.</td></tr>
<tr><td><strong>Strength</strong></td><td>Simple to reason about, and a natural home for authority &mdash; one place holds the state, enforces access and can fail.</td></tr>
<tr><td><strong>Weakness</strong></td><td>The server is a bottleneck and a single point of failure, and the model does not scale by adding peers.</td></tr>
<tr><td><strong>Examples</strong></td><td>A web browser and a web server, or an NFS client and a file server.</td></tr>
</tbody>
</table>

<p>The service interface is what says which calls are allowed remotely, and the model itself reappears wherever a client module hides server-side services behind one API.</p>

<h3>Peer-to-peer</h3>
<p>All processes play the <strong>same role</strong>. They interact with no distinction between clients and servers, the pattern of communication depends on the application, and any individual computer holds only a small part of the application database. Processing and communication load is spread across many computers and links, which makes it the most general and most flexible model.</p>
<p>Working mechanism:</p>
<ol>
<li><strong>Placement</strong> &mdash; the objects are distributed over the participating peers.</li>
<li><strong>Discovery</strong> &mdash; a peer locates the peers that hold the objects it needs.</li>
<li><strong>Exchange</strong> &mdash; the peers exchange objects directly, each also serving what it holds.</li>
<li><strong>Replication</strong> &mdash; a large number of replicas is maintained and kept usable.</li>
</ol>

<table class="comparison-table">
<thead>
<tr><th></th><th>Client-server</th><th>Peer-to-peer</th></tr>
</thead>
<tbody>
<tr><td><strong>Authority</strong></td><td>Control concentrated in one distinguished process.</td><td>Symmetric: the distinction between client and server is removed.</td></tr>
<tr><td><strong>Availability</strong></td><td>No single node's failure ends the service only if it is replicated; the server itself is a single point of failure.</td><td>No distinguished server to lose, and capacity grows with the number of participants rather than with the size of one machine.</td></tr>
<tr><td><strong>Cost</strong></td><td>Simple placement, but the server must be provisioned for the peak.</td><td>High complexity &mdash; where an object should be placed so it can be found cheaply, how it is found among many peers, and how many copies exist and are kept equal.</td></tr>
<tr><td><strong>Example</strong></td><td>A web browser and a web server.</td><td>File-sharing networks such as BitTorrent, where users share files across the Internet with no central server at all.</td></tr>
</tbody>
</table>

<h3>Multitier</h3>
<p>The client-server idea extended into layers, so each tier can be scaled and replaced on its own. The <em>three-tier application</em> is the clearest case: a presentation tier, an application or logic tier, and a data tier behind it.</p>
<figure class="figure-wide figure-wrap">
<svg class="figure wide" viewBox="0 0 780 250" role="img" aria-label="Three architecture models side by side: client and server with a request and reply arrow; four identical peers connected in a ring with no distinguished server; and a multitier stack of presentation, application and data tiers">
<defs><marker id="fd1a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="flow-arrow-head"/></marker></defs>

<text class="flow-label" x="135" y="22" text-anchor="middle">Client&ndash;server</text>
<rect class="flow-box phase1" x="45" y="38" width="180" height="44" rx="9"/>
<text class="flow-text" x="135" y="65">Client</text>
<rect class="flow-box phase2" x="45" y="150" width="180" height="44" rx="9"/>
<text class="flow-text" x="135" y="177">Server</text>
<path class="flow-arrow" d="M115,84 V146" marker-end="url(#fd1a)"/>
<path class="flow-arrow" d="M155,146 V84" marker-end="url(#fd1a)"/>
<text class="flow-label" x="96" y="120" text-anchor="middle">request</text>
<text class="flow-label" x="175" y="120" text-anchor="middle">reply</text>

<text class="flow-label" x="387" y="22" text-anchor="middle">Peer-to-peer</text>
<rect class="flow-box phase3" x="297" y="38" width="80" height="40" rx="9"/>
<text class="flow-text" x="337" y="63">Peer</text>
<rect class="flow-box phase3" x="417" y="38" width="80" height="40" rx="9"/>
<text class="flow-text" x="457" y="63">Peer</text>
<rect class="flow-box phase3" x="297" y="154" width="80" height="40" rx="9"/>
<text class="flow-text" x="337" y="179">Peer</text>
<rect class="flow-box phase3" x="417" y="154" width="80" height="40" rx="9"/>
<text class="flow-text" x="457" y="179">Peer</text>
<path class="flow-arrow" d="M377,58 H417"/>
<path class="flow-arrow" d="M377,174 H417"/>
<path class="flow-arrow" d="M337,78 V154"/>
<path class="flow-arrow" d="M457,78 V154"/>
<path class="flow-arrow" d="M457,78 C520,100 520,140 457,154"/>
<path class="flow-arrow" d="M337,154 C274,140 274,100 337,78"/>
<text class="flow-label" x="387" y="220" text-anchor="middle">no distinguished server</text>

<text class="flow-label" x="642" y="22" text-anchor="middle">Multitier</text>
<rect class="flow-box phase1" x="542" y="38" width="200" height="42" rx="9"/>
<text class="flow-text" x="642" y="64">Presentation tier</text>
<path class="flow-arrow" d="M642,80 V104" marker-end="url(#fd1a)"/>
<rect class="flow-box phase2" x="542" y="106" width="200" height="42" rx="9"/>
<text class="flow-text" x="642" y="132">Application tier</text>
<path class="flow-arrow" d="M642,148 V172" marker-end="url(#fd1a)"/>
<rect class="flow-box phase4" x="542" y="174" width="200" height="42" rx="9"/>
<text class="flow-text" x="642" y="200">Data tier</text>
</svg>
<figcaption>Fig 1.1 &mdash; The three architecture models of sub-topic 1.4. Client&ndash;server is a request/reply pair with a distinguished server; peer-to-peer has no distinguished node and no fixed direction of request; multitier splits the logic into layers that can each be replicated.</figcaption>
</figure>

<table class="comparison-table">
<thead>
<tr><th>Tier</th><th>What it holds</th><th>How it scales</th></tr>
</thead>
<tbody>
<tr><td><strong>Presentation</strong></td><td>What the user sees and works with.</td><td>Replicated near the users.</td></tr>
<tr><td><strong>Application (logic)</strong></td><td>The decisions and the rules of the application.</td><td>Servers are added here as load grows, because a tier that holds no state can be copied freely.</td></tr>
<tr><td><strong>Data</strong></td><td>The state.</td><td>The one tier that cannot simply be copied without deciding how the copies are kept equal, which is why consistency becomes a topic of its own.</td></tr>
</tbody>
</table>
<p>Split by function, one logical system serves thousands of clients from a handful of logic servers, and the tiers themselves are the distribution: they talk over the network exactly as any client and server do.</p>

<h3>Fundamental models</h3>
<p class="prereq-note">Outside the syllabus &mdash; 1.4 names three models: client-server, peer-to-peer and multitier. The fundamental models are the other taxonomy, background rather than a named sub-topic.</p>
<p>Fundamental models describe the properties <em>common to all</em> the architecture models. Three matter here.</p>

<table class="comparison-table">
<thead>
<tr><th>Model</th><th>What it describes</th><th>Key points</th></tr>
</thead>
<tbody>
<tr>
<td><strong>Interaction model</strong></td>
<td>How processes communicate and coordinate: information flow, plus the synchronisation and ordering of activities between processes.</td>
<td>It reflects the fact that communication takes place <em>with delays</em>, and it comes in two variants.</td>
</tr>
<tr>
<td><strong>Failure model</strong></td>
<td>Defines and classifies faults, so systems can have predictable behaviour when things break.</td>
<td>Such a system works as predicted <em>only as long as the real faults behave as the model says</em>. Classes: omission, timing and arbitrary failures.</td>
</tr>
<tr>
<td><strong>Security model</strong></td>
<td>Defines and classifies forms of attack.</td>
<td>Gives a basis for analysing the threats to a system and for designing systems that resist them.</td>
</tr>
</tbody>
</table>

<p>Putting time limits on process execution, message delivery or clock drift is hard in a distributed system. Whether such limits may be <em>assumed</em> is what separates the two variants of the interaction model:</p>

<table class="comparison-table">
<thead>
<tr><th></th><th>Synchronous distributed system</th><th>Asynchronous distributed system</th></tr>
</thead>
<tbody>
<tr><td><strong>Assumption about time</strong></td><td>Strong assumptions about time.</td><td>No assumption about time at all.</td></tr>
<tr><td><strong>Process execution</strong></td><td>Each step has a known lower and upper time bound.</td><td>No bound on execution speed; each step may take arbitrarily long.</td></tr>
<tr><td><strong>Message delivery</strong></td><td>Every message is received within a known bounded time.</td><td>No bound on transmission delay; a message may be received after an arbitrarily long time.</td></tr>
<tr><td><strong>Clocks</strong></td><td>Each local clock's drift from real time has a known bound.</td><td>No bound on clock drift; the drift rate is arbitrary.</td></tr>
<tr><td><strong>Consequence</strong></td><td>A time limit can be put on a reply, and a timeout treated as a failure.</td><td>No such limit can be assumed &mdash; a slow node and a dead node look identical.</td></tr>
</tbody>
</table>

<h3>Types: cluster, grid and cloud</h3>
<p class="prereq-note">Outside the syllabus &mdash; 1.4 names three models, and no sub-topic of the first unit is a system type. Cluster, grid and cloud computing are background here, and the cloud material proper begins at 5.1.</p>
<p>Distributed systems fall into three types, told apart by homogeneity, by geography and by what the user is buying.</p>

<table class="comparison-table">
<thead>
<tr><th>Type</th><th>Definition</th><th>Key feature</th></tr>
</thead>
<tbody>
<tr>
<td><strong>Cluster</strong></td>
<td>A parallel or distributed processing system made of interconnected stand-alone computers working cooperatively as a single, integrated computing resource. The computers may be uniprocessor or multiprocessor.</td>
<td><strong>Homogeneity</strong> &mdash; all computers run the same operating system and sit on the same network. Used for highly scalable services such as search engines, and for parallel programming, where one program runs in parallel across the machines.</td>
</tr>
<tr>
<td><strong>Grid</strong></td>
<td>A parallel and distributed system that enables the sharing, selection and aggregation of <em>geographically distributed autonomous</em> resources dynamically at runtime, depending on availability, capability, performance, cost and users' quality-of-service requirements.</td>
<td><strong>Heterogeneity</strong>, to a high degree, and five layers.</td>
</tr>
<tr>
<td><strong>Cloud</strong></td>
<td>Internet-based computing that provides shared processing resources and data to computers and other devices <em>on demand</em>, giving access to a shared pool of configurable computing resources.</td>
<td>Metered, elastic and on demand; the three service models are SaaS, PaaS and IaaS.</td>
</tr>
</tbody>
</table>

<h4>The five layers of a grid</h4>
<ol>
<li><strong>Fabric</strong> &mdash; the interface to local resources at a specific site, which can then be shared within a virtual organisation.</li>
<li><strong>Connectivity</strong> &mdash; the communication protocols that support grid transactions, including the delegation of rights from authenticated users to the programs running on their behalf.</li>
<li><strong>Resource</strong> &mdash; manages a single resource using the functions of the connectivity layer and the interfaces of the fabric layer, and is responsible for access control.</li>
<li><strong>Collective</strong> &mdash; handles access to multiple resources: discovery, allocation and scheduling, and data replication.</li>
<li><strong>Application</strong> &mdash; the applications that use the services the grid provides.</li>
</ol>
<p>The layers are a hierarchy of dependence: each uses the one below it, and only the fabric layer touches resources physically installed somewhere. What holds them together is the <em>virtual organisation</em> &mdash; a set of users and institutions sharing resources under agreed rules. The connectivity layer makes that sharing safe by <em>delegating</em> rights: a user authenticates once and the programs acting for them inherit exactly those rights and no more. Against the grid's definition, the resource and collective layers are where the runtime decisions about availability, capability, performance, cost and quality of service are actually made.</p>
<div class="concept-box asked">
<h4>Cluster vs grid vs cloud</h4>
<p>A cluster is homogeneous and local, a grid is heterogeneous and geographically distributed, and a cloud adds on-demand, metered access to a shared pool on top of a grid-like infrastructure. Homogeneity and geography are the two words that carry the comparison.</p>
</div>


`,
  revise: {"1.1":"<p>A <strong>distributed system</strong> is a collection of <strong>autonomous computing elements</strong> that appears to its users as a <strong>single coherent system</strong>.</p>\n<ul>\n<li><em>Autonomous</em>: each node keeps its own clock, decides for itself, and can fail on its own, so nothing is in charge of the whole.</li>\n<li><em>Single coherent system</em>: the user need not know which machine holds a file, how many machines are involved, or that any of them are remote.</li>\n<li>Components communicate and coordinate their actions only by <strong>passing messages</strong>.</li>\n</ul>\n","1.2":"<p>Four goals: <strong>resource sharing</strong>, <strong>openness</strong>, <strong>transparency</strong> and <strong>scalability</strong>.</p>\n<ul>\n<li>Resource sharing: remote data, files, printers, processors and storage used efficiently.</li>\n<li>Openness: services specified through standard rules and an interface written in an <strong>IDL</strong>, which is neutral about language and platform, buying <strong>interoperability</strong> and <strong>portability</strong>.</li>\n<li>Transparency is a family: access, location, migration, relocation, replication, concurrency, failure, persistence.</li>\n<li>Scalability keeps the cost of physical resources, lost performance and bottlenecks under control, by decentralised algorithms, caching and replication.</li>\n</ul>\n","1.3":"<p><strong>GFS</strong>, <strong>HDFS</strong> and <strong>BitTorrent</strong> are the three worked examples.</p>\n<ul>\n<li>GFS: a single master holds the metadata, files are split into large <strong>chunks</strong>, and chunks are replicated across many chunk servers.</li>\n<li>HDFS: a NameNode for metadata and many DataNodes holding replicated blocks, the descendant of GFS plus MapReduce.</li>\n<li>BitTorrent: a file is split into pieces, and every peer that holds pieces also serves them.</li>\n<li>Web search, commerce, healthcare, education and multiplayer games motivate the field.</li>\n</ul>\n","1.4":"<p>Three <strong>architecture models</strong> matter: <strong>client-server</strong>, <strong>peer-to-peer</strong> and <strong>multitier</strong>.</p>\n<ul>\n<li>Architecture models describe the placement of the parts and the relationships between them.</li>\n<li><strong>Fundamental models</strong> describe the properties all architectures share.</li>\n</ul>\n","the-three-characteristics-the-definition-implies":"<p>Three characteristics follow from the definition: <strong>concurrency</strong>, <strong>no global clock</strong> and <strong>independent failures</strong>.</p>\n<ul>\n<li>Concurrency: programs on different machines share resources and run at the same time, so two nodes may want the same resource at the same moment.</li>\n<li>No global clock: each machine has its own clock, so events are ordered by message passing, by Cristian's algorithm and NTP, or by Lamport's and vector clocks.</li>\n<li>Independent failures: any component may fail without bringing the system down, so the system must tolerate <strong>partial failure</strong>.</li>\n</ul>\n","further-characteristics":"<p>Beyond those three, further properties are expected: <strong>Heterogeneity</strong>, <strong>Openness</strong>, <strong>Security</strong>, <strong>Scalability</strong>, <strong>Transparency</strong> and <strong>Fault tolerance</strong>.</p>\n<ul>\n<li>Heterogeneity: components differ in network, hardware architecture, operating system, language and implementation, and still work together.</li>\n<li>Openness: services are offered through published, standard interfaces, such as REST APIs.</li>\n<li>Security: confidentiality, integrity and availability, harder here because parts travel over networks nobody controls.</li>\n<li>Scalability grows in size, geography and administration; transparency hides the machines; fault tolerance masks failure.</li>\n</ul>\n","advantages-and-disadvantages":"<p>The advantages and the disadvantages are the same properties seen from opposite sides.</p>\n<ul>\n<li>Advantages: <strong>economics</strong>, since microprocessors give better price and performance than one large machine; capacity added a machine at a time; data and resource sharing; flexibility.</li>\n<li>Disadvantages: <strong>security</strong> is the main concern, since every node has to be secured; <strong>loss of data</strong> is possible while data moves; software is far more complex to develop; and <strong>distribution of control</strong> makes administration and fault-finding difficult.</li>\n</ul>\n","main-problems-and-challenges":"<p>Four goals exist because four problems do: <strong>heterogeneity</strong>, <strong>reliability</strong>, <strong>security</strong> and <strong>scalability</strong>.</p>\n<ul>\n<li>Heterogeneity is masked by <strong>middleware</strong>, by internet protocols and by <strong>mobile code</strong>.</li>\n<li>Reliability separates <strong>availability</strong>, the fraction of time the system is usable, from continuous operation; <strong>redundancy</strong> raises availability.</li>\n<li>Security is <strong>confidentiality</strong>, <strong>integrity</strong> and <strong>availability</strong>, kept by encryption, authentication and authorisation.</li>\n<li>Scalability is size, geographical and administrative; the symptoms are cost, lost performance, software resources and bottlenecks.</li>\n</ul>\n","resource-sharing-and-what-a-service-is":"<p>A <strong>resource</strong> is the thing itself; a <strong>service</strong> is the interface that manages a collection of related resources and decides who may use them and how.</p>\n<ul>\n<li>Users share hardware such as a printer, data such as files, and specific functionality such as a search engine.</li>\n<li>A file service offers read, write and delete on files rather than exposing the files themselves.</li>\n<li>Services on other computers can only be invoked by communication.</li>\n</ul>\n","the-web-as-a-distributed-system":"<p>The Web's own difficulties are distribution problems seen in the wild.</p>\n<ul>\n<li><strong>Dangling links</strong>: a resource is deleted but links to it remain.</li>\n<li><strong>Slow response</strong> to web users.</li>\n<li>Lack of a proper user interface.</li>\n</ul>\n","client-server":"<p>Client and server: the client sends a request asking for a service, and the server returns the result or an error code.</p>\n<ul>\n<li>The request/reply runs over send/receive primitives, or through <strong>RPC</strong> or <strong>RMI</strong>.</li>\n<li>Strength: one distinguished process owns the service, so one place controls access and knows the state.</li>\n<li>Weakness: that server is a <strong>bottleneck</strong> and a <strong>single point of failure</strong>, and peers cannot be added to scale it.</li>\n</ul>\n","peer-to-peer":"<p>In the peer-to-peer model every process plays the same role, with no distinction between clients and servers.</p>\n<ul>\n<li>A large number of data objects are shared, and any one computer holds only a small part of the application database.</li>\n<li>Three problems follow: placing objects cleverly, retrieving the needed ones among many peers, and keeping the replicas equal.</li>\n<li>Availability needs no distinguished server: no single node's failure ends the service.</li>\n<li><strong>BitTorrent</strong> shares files across the internet with no central server at all.</li>\n</ul>\n","multitier":"<p>Multitier extends the client-server idea into layers, so each tier can be scaled and replaced on its own.</p>\n<ul>\n<li>The three-tier application: a <strong>presentation tier</strong>, an application or logic tier, and a data tier behind it.</li>\n<li>Presentation holds what the user sees, application the decisions, data the state.</li>\n<li>Split by function, one system serves thousands of clients from a handful of logic servers.</li>\n<li>The data tier cannot simply be copied without asking how the copies are kept equal.</li>\n</ul>\n","fundamental-models":"<p>Three <strong>fundamental models</strong> describe the properties common to all the architecture models.</p>\n<ul>\n<li><strong>Interaction model</strong>: how processes communicate and coordinate, including the ordering of activities between them.</li>\n<li><strong>Failure model</strong>: classifies faults as omission, timing and arbitrary failures, so behaviour stays predictable when things break.</li>\n<li><strong>Security model</strong>: classifies forms of attack, as a basis for analysing threats.</li>\n<li>A <strong>synchronous</strong> system bounds execution, message delivery and clock drift; an <strong>asynchronous</strong> one bounds nothing at all.</li>\n</ul>\n","types-cluster-grid-and-cloud":"<p>Distributed systems fall into three types: <strong>cluster</strong>, <strong>grid</strong> and <strong>cloud</strong>.</p>\n<ul>\n<li>Cluster: interconnected stand-alone computers working cooperatively as one integrated resource; its key feature is <strong>homogeneity</strong>.</li>\n<li>Grid: geographically distributed autonomous resources, shared and selected at runtime by availability, capability, performance, cost and quality of service; its five layers are <strong>fabric</strong>, <strong>connectivity</strong>, <strong>resource</strong>, <strong>collective</strong> and application.</li>\n<li>Cloud: on-demand access to a shared pool of configurable resources, in the models <strong>SaaS</strong>, <strong>PaaS</strong> and <strong>IaaS</strong>.</li>\n</ul>\n"},
  slides: `
<h2>The teacher's slides for this unit</h2>
<p class="ref-intro">These are the pictures that came with this unit &mdash; the class deck, the reference notes and the pages handed out with them &mdash; collected here so that the notes above read as writing rather than as a pile of screenshots. Each group is headed by the section of the notes its pictures belong to, in that order, and names the file and the slides they came from. The diagrams the notes themselves need are drawn in the notes.</p>

<h3>1.1 Definition and characteristics</h3>

<p class="ref-meta">From <em>Chapter1_Int to Distbd_Sys.pptx</em>, slides 2 and 4.</p>

<!-- dcc-fig:ch1/chapter1-int-to-distbd-sys-s04-002.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/chapter1-int-to-distbd-sys-s04-002.webp" alt="1.1 Introduction" width="353" height="280" loading="lazy" decoding="async">
<figcaption>1.1 Introduction</figcaption>
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch1/chapter1-int-to-distbd-sys-s02-001.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/chapter1-int-to-distbd-sys-s02-001.webp" alt="The technologies the course's field rests on - virtualized infrastructure, global…" width="1408" height="768" loading="lazy" decoding="async">
<figcaption>The technologies the course's field rests on - virtualized infrastructure, global…</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>1.2 Goals of distributed systems</h3>

<p class="ref-meta">From <em>Chapter1_Int to Distbd_Sys.pptx</em>, slide 12.</p>

<!-- dcc-fig:ch1/chapter1-int-to-distbd-sys-s12-004.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/chapter1-int-to-distbd-sys-s12-004.webp" alt="Design Goals…" width="562" height="241" loading="lazy" decoding="async">
<figcaption>Design Goals…</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>Main problems and challenges</h3>

<p class="ref-meta">From <em>Chapter1_Int to Distbd_Sys.pptx</em>, slide 14.</p>

<!-- dcc-fig:ch1/chapter1-int-to-distbd-sys-s14-005.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/chapter1-int-to-distbd-sys-s14-005.webp" alt="Middleware: Applies to a software layer, provides a programming abstraction, and masks the heterogeneity of…" width="463" height="265" loading="lazy" decoding="async">
<figcaption>Middleware: Applies to a software layer, provides a programming abstraction, and masks the heterogeneity of…</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>Client-server</h3>

<p class="ref-meta">From <em>Chapter1_Int to Distbd_Sys.pptx</em>, slide 18.</p>

<!-- dcc-fig:ch1/chapter1-int-to-distbd-sys-s18-006.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/chapter1-int-to-distbd-sys-s18-006.webp" alt="Contd.." width="852" height="492" loading="lazy" decoding="async">
<figcaption>Contd..</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>Peer-to-peer</h3>

<p class="ref-meta">From <em>Chapter1_Int to Distbd_Sys.pptx</em>, slide 19.</p>

<!-- dcc-fig:ch1/chapter1-int-to-distbd-sys-s19-007.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/chapter1-int-to-distbd-sys-s19-007.webp" alt="Peer-to-peer All process or objects play the same role." width="362" height="286" loading="lazy" decoding="async">
<figcaption>Peer-to-peer All process or objects play the same role.</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>Multitier</h3>

<p class="ref-meta">From <em>Chapter1_Int to Distbd_Sys.pptx</em>, slide 5.</p>

<!-- dcc-fig:ch1/chapter1-int-to-distbd-sys-s05-003.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/chapter1-int-to-distbd-sys-s05-003.webp" alt="Three Tier Application as Distributed System" width="907" height="797" loading="lazy" decoding="async">
<figcaption>Three Tier Application as Distributed System</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>Types: cluster, grid and cloud</h3>

<p class="ref-meta">From <em>Chapter1_Int to Distbd_Sys.pptx</em>, slide 24.</p>

<!-- dcc-fig:ch1/chapter1-int-to-distbd-sys-s24-008.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/chapter1-int-to-distbd-sys-s24-008.webp" alt="1.9 Types of Distributed System" width="396" height="272" loading="lazy" decoding="async">
<figcaption>1.9 Types of Distributed System</figcaption>
</figure>
<!-- /dcc-fig -->
`,
  quiz: [
    {
      q: 'Which is the more complete definition of a distributed system?',
      options: [
        'A set of computers connected by a local area network and sharing one operating system',
        'A collection of autonomous computing elements that appears to its users as a single coherent system',
        'Any system whose components communicate only through shared memory',
        'A system with one central server that all clients depend on'
      ],
      answer: 1,
      explanation: 'Both halves of the definition matter: "autonomous computing elements" gives independent clocks and independent failures, while "single coherent system" is the transparency goal. The Coulouris wording — components at networked computers that communicate and coordinate only by passing messages — says the same thing from the communication side.'
    },
    {
      q: 'Which three characteristics follow from the definition of a distributed system?',
      options: [
        'Scalability, security and transparency',
        'Concurrency, no global clock, independent failures',
        'Heterogeneity, openness and fault tolerance',
        'Client-server, peer-to-peer and multitier'
      ],
      answer: 1,
      explanation: 'These three follow because the definition forces them. Each one is the reason for a later unit: concurrency needs mutual exclusion, no global clock needs logical clocks, and independent failures need replication and a failure model.'
    },
    {
      q: 'In an open distributed system, what is an IDL for?',
      options: [
        'Encrypting messages between nodes',
        'Defining the interface of a service — function name, parameters, return values and exceptions — in a platform-neutral way',
        'Translating between different programming languages at runtime',
        'Compressing network traffic between heterogeneous nodes'
      ],
      answer: 1,
      explanation: 'An Interface Definition Language specifies syntax and semantics of services with a neutral interface, which is what makes interoperability (two implementations using each other\u2019s services) and portability possible. Openness also requires the documentation of components and interfaces to be published.'
    },
    {
      q: 'Accessing a remote file so that it feels exactly like a local file is an example of which kind of transparency?',
      options: [
        'Replication transparency',
        'Location transparency',
        'Access transparency',
        'Failure transparency'
      ],
      answer: 2,
      explanation: 'Access transparency hides differences in data representation and how a resource is accessed. Location transparency hides where the resource is, and replication transparency hides that further copies exist — the three are easy to confuse, so name the thing being hidden.'
    },
    {
      q: 'Which of these is NOT one of the four design goals of distributed systems listed in the unit?',
      options: [
        'Resource sharing',
        'Openness',
        'Scalability',
        'Metered billing'
      ],
      answer: 3,
      explanation: 'The four goals are resource sharing, openness, transparency and scalability. Metered billing is a property of cloud service models (Unit 5), not a design goal of distributed systems.'
    },
    {
      q: 'In the peer-to-peer model, which statement is true?',
      options: [
        'One process always acts as the server for the others',
        'All processes play the same role and interact without a client/server distinction',
        'Every peer must hold a full copy of the shared database',
        'Communication is always synchronous and bounded in time'
      ],
      answer: 1,
      explanation: 'All processes play the same role and the communication pattern depends on the application. Any individual computer holds only a small part of the application database — full copies would defeat the point, and maintaining many replicas is listed as one of peer-to-peer\u2019s problems.'
    },
    {
      q: 'Which problem is specifically listed as a weakness of peer-to-peer systems?',
      options: [
        'The server becomes a bottleneck',
        'High complexity of placing objects, retrieving them, and maintaining a large number of replicas',
        'Inability to share data objects between nodes',
        'Dependence on a single central index'
      ],
      answer: 1,
      explanation: 'A server bottleneck is the client-server weakness. Peer-to-peer has no central authority, and the price is complexity: objects must be placed cleverly, retrieval among many peers is hard, and replicas are numerous.'
    },
    {
      q: 'A system where every message is delivered within a known bounded time is best described as:',
      options: [
        'Asynchronous',
        'Synchronous',
        'Fault-tolerant',
        'Scalable'
      ],
      answer: 1,
      explanation: 'The synchronous model assumes known lower and upper bounds on execution steps, bounded message delivery and a bounded clock drift rate. The asynchronous model assumes none of these — which is why in an asynchronous system a slow node and a dead node cannot be told apart.'
    },
    {
      q: 'Which of the following is a FUNDAMENTAL model rather than an architectural model?',
      options: [
        'Client-server',
        'Peer-to-peer',
        'Multitier',
        'Interaction model'
      ],
      answer: 3,
      explanation: 'Architectural models are about the placement of parts and the relationships between them (client-server, peer-to-peer, multitier). Fundamental models describe properties common to all architectures: the interaction model, the failure model and the security model.'
    },
    {
      q: 'What is the main difference between a cluster and a grid?',
      options: [
        'A cluster is geographically distributed while a grid is local',
        'A cluster is homogeneous and local, while a grid is highly heterogeneous and geographically distributed',
        'A cluster only runs one program at a time',
        'A grid does not allow resource sharing'
      ],
      answer: 1,
      explanation: 'Cluster computing\u2019s defining feature is homogeneity — the same operating system on the same network. A grid explicitly aggregates geographically distributed autonomous resources with a high degree of heterogeneity, and its lowest layer is the fabric layer that exposes local resources.'
    },
    {
      q: 'Which layer of a grid architecture is responsible for resource discovery, allocation and scheduling across multiple resources?',
      options: [
        'Fabric layer',
        'Connectivity layer',
        'Collective layer',
        'Resource layer'
      ],
      answer: 2,
      explanation: 'The collective layer handles access to multiple resources. The fabric layer exposes local resources, the connectivity layer carries grid transactions and delegates rights, and the resource layer manages a single resource and does its access control.'
    },
    {
      q: 'Which three components must a secure distributed system satisfy?',
      options: [
        'Confidentiality, Integrity and Availability',
        'Openness, Transparency and Scalability',
        'Authentication, Replication and Redundancy',
        'Latency, Throughput and Availability'
      ],
      answer: 0,
      explanation: 'The CIA triad. The mechanisms the unit names for achieving it are encryption, authentication and authorisation, and it notes that some challenges remain — denial-of-service attacks and mobile code security.'
    }
  ],
  past: [
    {
      year: 'Model 2025',
      marks: '2',
      repeats: 1,
      q: 'Define a distributed system.',
      occ: [
        { year: 'Model 2025', marks: '2', q: 'Define a distributed system.' }
      ],
      answer: `
<h4>Model answer &mdash; 2 marks</h4>
<p>A <strong>distributed system</strong> is a collection of <strong>autonomous computing elements</strong> that appears to its users as a <strong>single coherent system</strong>. Equivalently, it is a system in which hardware or software components located at networked computers communicate and coordinate their actions <em>only by passing messages</em>.</p>
<p>The definition carries three characteristics:</p>
<ul>
<li><strong>Concurrency</strong> &mdash; multiple processes on different machines execute at the same time and share resources.</li>
<li><strong>No global clock</strong> &mdash; each machine has its own clock, so there is no single universal time and communication is only by messages.</li>
<li><strong>Independent failures</strong> &mdash; any component can fail on its own, so the system must tolerate partial failure.</li>
</ul>
<div class="concept-box tip">
<h4>Where this came from</h4>
<p>Group A, question 1 of the <em>Model Question 2025</em> in the syllabus, worth 2 marks. Group A carries four such questions and the paper says <code>2*4=8</code>, so each is worth 2. One mark is the definition, the other is knowing what follows from it &mdash; the three characteristics are the cheapest way to earn the second.</p>
</div>`
    },
    {
      year: 'Model 2025',
      marks: '4',
      repeats: 1,
      q: 'Explain the goals of distributed systems.',
      occ: [
        { year: 'Model 2025', marks: '4', q: 'Explain the goals of distributed systems.' }
      ],
      answer: `
<h4>Model answer &mdash; 4 marks</h4>
<p>Four goals must be met for a system to work in a distributed environment. They come in pairs &mdash; the first two are about what the system does for its users, the last two about whether it still works when it grows.</p>

<p><strong>1. Resource sharing.</strong> Available physical and non-physical resources &mdash; remote data, files, printers, processors, storage &mdash; are shared efficiently. Sharing is the main motivation for building a distributed system at all, and it gives a cost-effective implementation of the whole system, but it requires collaboration and information exchange between nodes and raises security concerns. <em>Example:</em> a networked printer shared by an office, or a file service exposing read, write and delete operations on remote files.</p>

<p><strong>2. Openness.</strong> Services are specified through standard rules, with their syntax and semantics defined through an interface written in an <strong>IDL (Interface Definition Language)</strong>. The IDL describes the function name, parameters, return values, possible exceptions and how the service is used, while the interface itself stays neutral. Openness gives <strong>interoperability</strong> (two implementations using each other's services) and <strong>portability</strong> (an application written for one distributed system running correctly on another with the same implementations), and it lets components be added or removed without affecting the rest. The first step is publishing the documentation of components and interfaces.</p>

<p><strong>3. Transparency.</strong> The system must realise a single coherent system by hiding its processes and resources. This is a family of properties rather than one: <em>access</em> transparency (a remote resource is used exactly as a local one), <em>location</em> (where the resource is), <em>migration</em> and <em>relocation</em> (that it may move, even while in use), <em>replication</em> (that copies exist), <em>concurrency</em> (that others are sharing it), <em>failure</em> (that a component failed and was recovered from) and <em>persistence</em> (whether storage is memory or disk).</p>

<p><strong>4. Scalability.</strong> The system must keep working as it grows, which means controlling four things: the <em>cost of physical resources</em>, which should rise linearly with size and no faster; <em>performance loss</em>, so a larger system is not dramatically slower per operation; <em>software resources</em>, which must not run out (address space, file descriptors, names); and <em>performance bottlenecks</em>. The practical answer to the last one is <strong>decentralised algorithms</strong> with no single node everyone must talk to, together with <strong>caching</strong> and <strong>replication</strong> &mdash; which is how the Web scales.</p>

<div class="concept-box tip">
<h4>Where this came from</h4>
<p>Group B, question 5 of the <em>Model Question 2025</em>. The paper's arithmetic fixes Group B at 4 marks each: Group A is <code>2*4 = 8</code>, Group C carries two <code>[4+4]</code> questions and so is 8 each, and <code>8 + 7(4) + 3(8) = 60</code>. Four goals, four marks &mdash; name all four and give each one a sentence and an example.</p>
</div>`
    },
    {
      year: 'Model 2025',
      marks: '4',
      repeats: 1,
      q: 'Differentiate between client-server and peer-to-peer architectures with examples.',
      occ: [
        { year: 'Model 2025', marks: '4', q: 'Differentiate between client-server and peer-to-peer architectures with examples.' }
      ],
      answer: `
<h4>Model answer &mdash; 4 marks</h4>
<p>Both are <em>architectural</em> models &mdash; they describe where the parts of a distributed system sit and how they relate. The difference is whether one role is distinguished from the others.</p>

<table class="comparison-table">
<thead>
<tr><th></th><th>Client-server</th><th>Peer-to-peer</th></tr>
</thead>
<tbody>
<tr><td><strong>Roles</strong></td><td>A distinguished server provides a service; clients request it. Roles are fixed.</td><td>All processes or objects play the <em>same</em> role, with no distinction between clients and servers.</td></tr>
<tr><td><strong>Interaction</strong></td><td>A simple request/reply protocol: the client sends a request (invocation), the server does the work and returns a result or an error code.</td><td>The pattern of communication depends on the application; it is not a fixed request/reply direction.</td></tr>
<tr><td><strong>Data placement</strong></td><td>Held and controlled by the server.</td><td>Data objects are shared, and any individual computer holds only a <em>small part</em> of the application database.</td></tr>
<tr><td><strong>Load</strong></td><td>Concentrated on the server, which is a bottleneck and a single point of failure.</td><td>Processing and communication load for access to objects is distributed across many computers and access links.</td></tr>
<tr><td><strong>Strengths</strong></td><td>Simple, one place for authority and access control, and the natural fit for RPC and RMI.</td><td>The most general and most flexible model; scales by adding peers rather than upgrading one machine.</td></tr>
<tr><td><strong>Weaknesses</strong></td><td>The server is a bottleneck and a single point of failure; it does not scale by adding peers.</td><td>High complexity from clever object placement, difficulty retrieving objects, and maintaining a potentially large number of replicas.</td></tr>
<tr><td><strong>Example</strong></td><td>The Web: a browser requests a page from a web server. Or GFS/HDFS, where a single master (NameNode) serves metadata to many clients.</td><td>BitTorrent: a file is split into pieces and every peer that holds pieces also serves them.</td></tr>
</tbody>
</table>

<p>The Multitier model is the third architecture named in the syllabus and can be added in a line: it extends client-server into layers &mdash; presentation, application and data &mdash; so that each tier can be scaled and replaced independently. See <strong>Fig 1.1</strong> in 1.4, which draws all three side by side.</p>

<div class="concept-box tip">
<h4>Where this came from</h4>
<p>Group B, question 6 of the <em>Model Question 2025</em>, worth 4 marks (see the arithmetic in the note on the goals question above). "With examples" is in the question, so the answer must name one per model &mdash; a comparison table with no examples caps the score.</p>
</div>`
    }
  ]
};
