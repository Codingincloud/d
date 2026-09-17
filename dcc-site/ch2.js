/* Chapter 2 — Communication in Distributed Systems.

   Syllabus unit 2: 7 hours, 10 marks — the heaviest unit on the paper.
   Sub-topics 2.1 Remote Procedure Calls (RPC), 2.2 Remote Method Invocation
   (RMI), 2.3 Message Passing and Serialization, 2.4 Sockets and Web services
   (REST & SOAP).

   Written from the course's own material, read into `_source/dcc/` by
   tools/dcc_extract.py:

     lecture_notes_all_chapterwise_lecturemain_ch_2_communication_in_ds.txt
         Er. Avijit Karn's 48-slide Chapter 2 deck — distributed objects, RPC
         and its call semantics, RMI and its implementation, message passing
         and MPI, and sockets. Most of its slides are pictures, so the deck's
         own diagrams were OCR'd to recover their labels (slides 6-8, 13-14,
         30-48) — the ten RPC steps below are the deck's slide 8 read off the
         picture, not paraphrase.

     rest_soap_webservices.txt, rest_soap_webservices_lecture.txt
         Hans-Petter Halvorsen's Web Services deck on the SOAP and REST stacks

     messagepassing_referencenote.txt, messagepassing_refnote2.txt
         the message-passing reference notes (PVM/MPI) and the
         Communication (II) notes covering persistence and synchronicity

   Where a fact comes from a reference note rather than the class deck, the text
   says which. */

window.CHAPTERS = window.CHAPTERS || {};
window.CHAPTERS[2] = {
  learn: `
<h2>Unit 2 &mdash; Communication in Distributed Systems</h2>
<p class="unit-meta">Syllabus: 7 hours &middot; 10 marks &middot; sub-topics 2.1&ndash;2.4</p>

<p>Components of a distributed system communicate <em>only by passing messages</em>: they cannot share memory and they cannot read each other's clocks. The abstractions below make message passing look like an ordinary call, and the mechanisms underneath them are what carry the message.</p>

<div class="concept-box key">
<h4>The communication mechanisms in one line</h4>
<p>RPC makes a <em>procedure</em> call look local. RMI makes a <em>method</em> call on a remote object look local. Message passing states that it is a message and gives the primitives. Web services are message passing between programs that were never written to cooperate, carried over HTTP because a firewall lets HTTP through.</p>
</div>

<h2>2.0 Distributed objects &mdash; the starting point</h2>
<p class="prereq-note">Outside the syllabus &mdash; the sub-topic list begins at 2.1. This is the ground the unit builds on.</p>

<div class="concept-box key">
<h4>Definition</h4>
<p><strong>Distributed objects</strong> are objects that live in different address spaces and work together by sharing data and invoking each other's methods, following the object-oriented programming model. The address spaces may be processes on one computer or processes on different computers in a network.</p>
</div>
<p>Three properties follow from the definition:</p>
<ul>
<li><strong>Objects communicate</strong> &mdash; a caller invokes a method rather than exchanging raw bytes by hand, and the abstraction is what hides the complexity of distributed programming.</li>
<li><strong>Location transparency</strong> &mdash; the caller does not know where the object is, which is why distributed objects generally communicate using <strong>RMI</strong>.</li>
<li><strong>No local equivalent</strong> &mdash; the six differences below all follow from the separate address spaces.</li>
</ul>

<h3>Where a local object and a distributed object differ</h3>
<table class="comparison-table">
<thead>
<tr><th>Area</th><th>A local object</th><th>Consequence for a distributed object</th></tr>
</thead>
<tbody>
<tr><td><strong>Reference</strong></td><td>A pointer or reference into the same address space, usually one machine word.</td><td>A reference must be meaningful in another address space, which is why the <em>remote object reference</em> and the binder exist (2.2).</td></tr>
<tr><td><strong>Request latency</strong></td><td>A few instructions, bounded by local memory speed.</td><td>Every call crosses a network: latency is orders of magnitude larger and <em>variable</em>, which is why many small calls perform badly.</td></tr>
<tr><td><strong>Object activation</strong></td><td>The object is in memory, because the process is running.</td><td>The remote object may not be instantiated yet, so the call may have to activate it first.</td></tr>
<tr><td><strong>Parallelism</strong></td><td>Two calls on one object are serialised by the single process.</td><td>Calls can arrive from several clients at once, so the object has to behave correctly in a <em>concurrent</em> environment.</td></tr>
<tr><td><strong>Failure</strong></td><td>Either the whole process works or it does not; there is no partial failure.</td><td><strong>Partial failure can happen.</strong> A call can be lost, the server can crash after executing, or the client can crash after asking &mdash; and that is what call semantics exist for.</td></tr>
<tr><td><strong>Security</strong></td><td>Enforced by the operating system on the local machine.</td><td>Data crosses a network between parties that do not trust each other, so access control and authentication move into the middleware.</td></tr>
</tbody>
</table>

<p>Two mechanisms carry communication between distributed objects: <strong>RPC</strong> and <strong>RMI</strong>.</p>

<h2>2.1 Remote Procedure Calls (RPC)</h2>

<div class="concept-box key">
<h4>Definition</h4>
<p><strong>Remote Procedure Call</strong> is an interaction in which a client invokes a procedure that resides remotely on a server; the server executes the procedure and returns the result to the client. The client's call is <em>blocked</em> until the result arrives, so the caller pays blocking and gets the single-process procedure-call model in return.</p>
</div>
<ul>
<li><strong>The local call model</strong> &mdash; that is the point of the name, so RPC is a <em>high-level</em> network interface rather than a low-level one.</li>
<li><strong>A service interface</strong> defines the procedures a server process offers for remote calling.</li>
<li><strong>A request&ndash;reply protocol</strong> carries the calls, and it deliberately omits the object reference: a request names a procedure, not an object.</li>
</ul>

<div class="concept-box warn">
<h4>What conventional RPC does <em>not</em> give you</h4>
<p>Simple RPC does not maintain <strong>access transparency</strong>: the data representation and the way an object is accessed are not hidden, so a remote call does not look exactly like a local one. The stub layer exists to fix that, and 2.2's proxy layer formalises it.</p>
</div>
<h3>How RPC works in ten steps</h3>
<p>The sequence below is the whole mechanism: steps 1&ndash;3 are the client side, 4&ndash;7 the server side, 8&ndash;10 the reply. Neither application procedure knows it took part in a network call.</p>

<figure class="figure-wide figure-wrap">
<svg class="figure wide" viewBox="0 0 800 400" role="img" aria-label="Ten-step remote procedure call sequence: client process calls the client stub, the stub marshals parameters and calls the local kernel, the kernel sends the message over the network, the remote operating system passes it to the server stub, which unmarshals it and calls the server, and the result returns along the same path in reverse">
<defs><marker id="f2a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="flow-arrow-head"/></marker></defs>

<text class="flow-label" x="120" y="24" text-anchor="middle">Client machine</text>
<text class="flow-label" x="680" y="24" text-anchor="middle">Server machine</text>

<rect class="flow-box phase1" x="30" y="40" width="180" height="46" rx="9"/>
<text class="flow-text" x="120" y="68">1. Client procedure</text>
<rect class="flow-box phase2" x="30" y="118" width="180" height="46" rx="9"/>
<text class="flow-text" x="120" y="146">2. Client stub</text>
<rect class="flow-box phase4" x="30" y="196" width="180" height="46" rx="9"/>
<text class="flow-text" x="120" y="224">3. Client kernel</text>

<rect class="flow-box phase1" x="590" y="40" width="180" height="46" rx="9"/>
<text class="flow-text" x="680" y="68">6. Server</text>
<rect class="flow-box phase2" x="590" y="118" width="180" height="46" rx="9"/>
<text class="flow-text" x="680" y="146">5. Server stub</text>
<rect class="flow-box phase4" x="590" y="196" width="180" height="46" rx="9"/>
<text class="flow-text" x="680" y="224">4. Remote OS</text>

<path class="flow-arrow" d="M120,86 V114" marker-end="url(#f2a)"/>
<path class="flow-arrow" d="M120,164 V192" marker-end="url(#f2a)"/>
<path class="flow-arrow" d="M680,192 V168" marker-end="url(#f2a)"/>
<path class="flow-arrow" d="M680,114 V90" marker-end="url(#f2a)"/>

<path class="flow-arrow" d="M214,219 H586" marker-end="url(#f2a)"/>
<text class="flow-label" x="400" y="210" text-anchor="middle">request message (procedure number + marshalled arguments)</text>

<path class="flow-arrow" d="M586,263 H214" marker-end="url(#f2a)"/>
<text class="flow-label" x="400" y="285" text-anchor="middle">reply message (marshalled result)</text>

<rect class="flow-box phase3" x="290" y="250" width="220" height="34" rx="8"/>
<text class="flow-text" x="400" y="272">network &mdash; connectionless or connection-oriented</text>

<text class="flow-text" x="400" y="326" text-anchor="middle">7&ndash;10. The result returns along the same path in reverse:</text>
<text class="flow-label" x="400" y="350" text-anchor="middle">server stub packs a message &rarr; server OS &rarr; client OS &rarr; client stub unmarshals &rarr; waiting client procedure</text>
<text class="flow-label" x="400" y="376" text-anchor="middle">the client procedure is blocked from step 1 until the reply arrives</text>
</svg>
<figcaption>Fig 2.1 &mdash; The functional steps in a remote procedure call. The stub layer on each side is what makes a network call look like a local one. Steps 1&ndash;10 are the standard call sequence; the two call-sites are the principle-of-RPC pairing, where the client's <em>call remote procedure</em> sits immediately above a <em>wait for result</em> that does not return until the reply.</figcaption>
</figure>
<div class="worked">
<div class="worked-head"><h4>The 10-Step RPC Sequence</h4></div>
<ol class="worked-steps">
<li>The client procedure calls the client stub in the normal way.<br><span class="worked-note">From here nothing is unusual &mdash; it is an ordinary local call.</span></li>
<li>The client stub builds a message including the parameters and the name or number of the procedure to be called, and calls the local operating system.<br><span class="worked-note">Packaging the arguments into a network message is called <strong>marshalling</strong>.</span></li>
<li>The client sends the message to the remote OS via a system call to the local kernel.<br><span class="worked-note">To transfer the message some protocol is used, either connectionless or connection-oriented.</span></li>
<li>The remote OS gives the message to the server stub.</li>
<li>The server stub unpacks the parameters &mdash; unmarshals them &mdash; and calls the server.</li>
<li>The server does the work and returns the result to the stub.</li>
<li>The server stub packs the result into a message and calls its local OS.</li>
<li>The server's OS sends the message to the client's OS.</li>
<li>The client's OS gives the message to the client stub.</li>
<li>The stub unpacks the result and returns it to the waiting client procedure.</li>
</ol>
</div>
<div class="concept-box key">
<h4>Two words to use precisely</h4>
<p><strong>Marshalling</strong> is packing arguments into a message on the way out (step 2); <strong>unmarshalling</strong> is unpacking them on the way in (step 5). Everything else in the sequence is the transport that carries their output and their input.</p>
</div>

<h3>Advantages and disadvantages</h3>

<table class="comparison-table">
<thead>
<tr><th>Benefits</th><th>Disadvantages</th></tr>
</thead>
<tbody>
<tr><td>Despite being local, the called procedure can be executed in a different process and on a different machine.</td><td>Based only on the parameters call-by-value and call-by-reference, which is not always acceptable for a remote call.</td></tr>
<tr><td>Supports process and thread-oriented models.</td><td>Can be <strong>slower due to overheads</strong> &mdash; marshalling, the network round trip and the kernel calls at both ends.</td></tr>
<tr><td>Provides <strong>access transparency</strong> when the stub layer is complete.</td><td><strong>Non-flexible for hardware architectures</strong> &mdash; the marshalled representation must be agreed on both ends.</td></tr>
<tr><td><strong>Code reusability</strong>, and the same call can be used in a local and a distributed environment.</td><td></td></tr>
</tbody>
</table>

<p>Two rows are the reason later mechanisms exist. <em>Call-by-value</em> and <em>call-by-reference</em> are both local mechanisms, and a reference is an address inside one address space, so sending it to another machine sends something meaningless; the repair is the <strong>remote object reference</strong> and the stub that turns the call into a message. The other is the inflexibility about hardware and representation: both ends must agree how parameters are laid out, so the interface has to be expressed in a language-neutral form &mdash; an IDL such as CORBA's, or a data format such as JSON. Each disadvantage maps onto one of the ten steps: marshalling, the round trip and the kernel calls are what the benefit costs.</p>

<h3>RPC issues &mdash; the five things that go wrong</h3>
<p>Because the caller and the provider of the procedure are in distant locations, normal functioning can be disrupted in five ways.</p>

<table class="comparison-table">
<thead>
<tr><th>#</th><th>Fault</th><th>What the client observes</th><th>Mechanism that addresses it</th></tr>
</thead>
<tbody>
<tr><td>1</td><td>The client is unable to locate the server</td><td>No route to the procedure at all &mdash; a binding failure, not a lost message.</td><td>A naming or binder service that maps a name to a current address.</td></tr>
<tr><td>2</td><td><strong>Lost request message</strong></td><td>The reply never arrives; the client cannot tell this from a slow server.</td><td>Retransmit the request after a timeout.</td></tr>
<tr><td>3</td><td><strong>Lost reply message</strong></td><td>The operation was in fact performed, but the client never learns the result.</td><td>Retransmit, or keep a history of results.</td></tr>
<tr><td>4</td><td><strong>Server crash</strong> after receiving a request</td><td>The client cannot know whether the procedure ran before the crash.</td><td>Duplicate filtering and idempotent operation design.</td></tr>
<tr><td>5</td><td><strong>Client crash</strong> after sending a request</td><td>The server may compute a result nobody will ever collect &mdash; an <em>orphan</em> call.</td><td>Orphans are detected and discarded (see <em>last-of-many</em> semantics).</td></tr>
</tbody>
</table>

<p>Under these fault conditions, <strong>call semantics</strong> define when and how often a remote procedure may be executed, and they have to hold whether the procedure is implemented locally or remotely &mdash; otherwise the abstraction leaks and the program becomes untestable.</p>

<h3>Call semantics</h3>

<table class="comparison-table">
<thead>
<tr><th>Semantics</th><th>What is guaranteed</th><th>How it is achieved / what can go wrong</th></tr>
</thead>
<tbody>
<tr><td><strong>Exactly once</strong></td><td>The procedure executes once and only once, always.</td><td>The ideal, but hard to achieve in practice. It relies on time-outs, retransmissions, the same call identifier on every retransmission, and a cache associated with the callee that recognises a repeat of the same call.</td></tr>
<tr><td><strong>At most once</strong> (also called <em>maybe</em>)</td><td>The procedure executes once, or not at all. The client cannot tell which.</td><td>The RPC is requested only once and never retried: one request, no server-side bookkeeping.<div class="concept-box warn"><h4>What can go wrong</h4><p>No reply may mean no execution took place.</p></div></td></tr>
<tr><td><strong>At least once</strong></td><td>The procedure executes one or more times &mdash; definitely once if the client gets a reply.</td><td>The client keeps requesting the RPC until a valid response arrives.<div class="concept-box warn"><h4>What can go wrong</h4><p>The operation might be executed multiple times. Safe only when repeating the operation is harmless (idempotent).</p></div></td></tr>
<tr><td><strong>Last once</strong></td><td>The most recent call is the one whose result counts.</td><td>Based on time-outs: the request is retransmitted until the result of the execution is received.</td></tr>
<tr><td><strong>Last-of-many call</strong></td><td>The call is accepted only when the identifier matches the most recent call.</td><td>Accepts only the newest call.<div class="concept-box warn"><h4>What can go wrong</h4><p>It neglects orphan calls &mdash; those whose caller has expired because its node crashed.</p></div></td></tr>
</tbody>
</table>

<div class="concept-box warn">
<h4>The trade-off</h4>
<p>Each step down the table buys reliability of delivery at the cost of knowing less about how many times the work happened: <em>at least once</em> can execute twice, <em>at most once</em> can execute zero times. The engineering answer to the first is an <strong>idempotent</strong> operation &mdash; one that can be repeated with the same effect.</p>
</div>

<h3>Providing a reliable request&ndash;reply protocol</h3>
<p>Three fault-tolerant measures sit underneath the semantics, and each is one decision a designer makes.</p>

<table class="comparison-table">
<thead>
<tr><th>Measure</th><th>The decision</th><th>The cost of choosing it</th></tr>
</thead>
<tbody>
<tr><td><strong>Retry request message</strong></td><td>Whether to retransmit the request message until either a reply is received or the server is assumed to have failed.</td><td>The server may execute the procedure more than once &mdash; the <em>at least once</em> hazard.</td></tr>
<tr><td><strong>Duplicate filtering</strong></td><td>When retransmissions are used, whether to filter out duplicate requests at the server.</td><td>The server must remember identifiers of requests it has seen, which costs state and time.</td></tr>
<tr><td><strong>Retransmission of results</strong></td><td>Whether to keep a <strong>history of result messages</strong> so that lost replies can be re-sent <em>without re-executing</em> the operation at the server.</td><td>The server must store results, and clients must accept that the retransmitted reply is the cached one.</td></tr>
</tbody>
</table>
<p>The third is the fix for the most awkward of the five faults: a lost reply means the work <em>was</em> done, so re-executing the procedure to satisfy the client is exactly the wrong response, and keeping results avoids it.</p>

<h2>2.2 Remote Method Invocation (RMI)</h2>

<div class="concept-box key">
<h4>Definition</h4>
<p><strong>Remote Method Invocation</strong> is a communication mechanism among distributed objects in which a method invocation between objects in different processes takes place, whether those processes are on the same machine or separated. Each process holds a set of objects, and those objects may receive local invocations, remote invocations or both; objects that receive remote invocations are called <em>remote objects</em>.</p>
</div>
<p>RPC invokes a procedure by name and deliberately drops the object reference from the request. RMI keeps the object: the caller holds a reference to an object that happens to live in another process, and calls a method on it.</p>

<table class="comparison-table">
<thead>
<tr><th></th><th>RPC</th><th>RMI</th></tr>
</thead>
<tbody>
<tr><td><strong>What is invoked</strong></td><td>A procedure, named in the request message.</td><td>A method on a remote object.</td></tr>
<tr><td><strong>Object reference</strong></td><td>Deliberately omitted: the request names a procedure, not an object.</td><td>Required: the caller holds a <em>remote object reference</em>.</td></tr>
<tr><td><strong>Interface</strong></td><td>A service interface listing the procedures available for remote calling.</td><td>A remote interface listing the methods that may be invoked remotely.</td></tr>
<tr><td><strong>Machinery</strong></td><td>Client stub, server stub and the request&ndash;reply protocol.</td><td>Proxy, dispatcher, skeleton, remote reference module and binder, on top of the same protocol.</td></tr>
</tbody>
</table>

<figure class="figure-wide figure-wrap">
<svg class="figure wide" viewBox="0 0 780 300" role="img" aria-label="Two processes, each holding objects. Object A in the client process holds a proxy for the remote object B in the server process; the request travels through the communication module and the remote reference module to the skeleton and dispatcher, which invoke the servant that implements B's remote interface.">
<defs><marker id="f2b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="flow-arrow-head"/></marker></defs>

<text class="flow-label" x="150" y="22" text-anchor="middle">Client process</text>
<text class="flow-label" x="630" y="22" text-anchor="middle">Server process</text>

<rect class="flow-box phase1" x="50" y="36" width="200" height="42" rx="9"/>
<text class="flow-text" x="150" y="62">Object A</text>
<rect class="flow-box phase2" x="50" y="90" width="200" height="42" rx="9"/>
<text class="flow-text" x="150" y="116">Proxy for B</text>
<rect class="flow-box phase4" x="50" y="186" width="200" height="42" rx="9"/>
<text class="flow-text" x="150" y="212">Communication module</text>
<rect class="flow-box phase4" x="50" y="240" width="200" height="36" rx="9"/>
<text class="flow-text" x="150" y="263">Remote reference module</text>

<rect class="flow-box phase1" x="530" y="36" width="200" height="42" rx="9"/>
<text class="flow-text" x="630" y="62">Servant (object B)</text>
<rect class="flow-box phase2" x="530" y="90" width="200" height="42" rx="9"/>
<text class="flow-text" x="630" y="116">Skeleton &amp; dispatcher</text>
<rect class="flow-box phase4" x="530" y="186" width="200" height="42" rx="9"/>
<text class="flow-text" x="630" y="212">Communication module</text>
<rect class="flow-box phase4" x="530" y="240" width="200" height="36" rx="9"/>
<text class="flow-text" x="630" y="263">Remote reference module</text>

<path class="flow-arrow" d="M150,78 V86" marker-end="url(#f2b)"/>
<path class="flow-arrow" d="M150,132 V182" marker-end="url(#f2b)"/>
<path class="flow-arrow" d="M630,132 V182" marker-end="url(#f2b)"/>
<path class="flow-arrow" d="M630,186 V82" marker-end="url(#f2b)"/>

<path class="flow-arrow" d="M254,204 H526" marker-end="url(#f2b)"/>
<text class="flow-label" x="390" y="196" text-anchor="middle">request</text>
<path class="flow-arrow" d="M526,244 H254" marker-end="url(#f2b)"/>
<text class="flow-label" x="390" y="288" text-anchor="middle">reply</text>

<text class="flow-label" x="390" y="150" text-anchor="middle">The proxy is what makes a remote invocation look local:</text>
<text class="flow-label" x="390" y="170" text-anchor="middle">it marshals, sends, receives and unmarshals.</text>
</svg>
<figcaption>Fig 2.2 &mdash; The RMI software between application objects and the communication layer. Proxy, dispatcher and skeleton sit <em>between</em> the application-level objects and the communication and remote-reference modules. The same four roles are one column per process in the original figure; the arrangement here is drawn so the request and reply path is readable.</figcaption>
</figure>
<h3>What a remote invocation requires</h3>
<ul>
<li><strong>A remote object reference</strong> &mdash; an object in another process needs one before its methods can be invoked, and it is the repaired version of the pointer RPC cannot send.</li>
<li><strong>A remote interface</strong> &mdash; it specifies which methods can be invoked remotely. Objects in other processes can invoke <em>only</em> the methods in it; everything else is private to the process that holds the object.</li>
<li><strong>A remote object</strong> &mdash; the class that implements it usually has to be usable by a local caller as well, so the implementation is separated from what is exposed.</li>
</ul>
<!-- dcc-fig:ch2/lecturemain-ch-2-communication-in-ds-s13-011.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/lecturemain-ch-2-communication-in-ds-s13-011.webp" alt="Each process holds objects: B and F can receive remote invocations, while C, D and E can only be invoked locally." width="1132" height="262" loading="lazy" decoding="async">
<figcaption>Each process holds objects: B and F can receive remote invocations, while C, D and E can only be invoked locally.</figcaption>
</figure>
<!-- /dcc-fig -->
<p>In the diagram, B and F can receive remote invocations while C, D and E cannot, and nothing visible from outside tells them apart &mdash; only the interface does. The interface is therefore a boundary the runtime enforces, not documentation.</p>
<h3>The RMI software</h3>
<p>Explaining RMI's implementation means accounting for five roles, and each is a distinct piece of the middleware.</p>

<table class="comparison-table">
<thead>
<tr><th>Role</th><th>What it does</th></tr>
</thead>
<tbody>
<tr><td><strong>Proxy</strong></td><td>Makes remote invocation <em>transparent</em> to the client: it marshals arguments, forwards the request, receives the message and unmarshals results, so from the client's side it behaves like the object itself.</td></tr>
<tr><td><strong>Dispatcher</strong></td><td>Handles the transfer of requests to the correct method: it receives requests, selects the correct method and passes the request message on.</td></tr>
<tr><td><strong>Skeleton</strong></td><td>Implements the methods of the remote interface: it unmarshals arguments from the request, invokes the method of the remote object and marshals the result.</td></tr>
<tr><td><strong>Remote reference module</strong></td><td>Translates between local and remote object references and keeps the remote object table: an entry for each remote object held by the process and for each local proxy. It creates a remote object reference when one arrives, and looks one up when a reference has to be passed, creating a new entry if necessary.</td></tr>
<tr><td><strong>Binder</strong></td><td>A separate service holding a table of mappings from textual names to remote object references. Servers register objects with it; clients look references up in it.</td></tr>
</tbody>
</table>

<p>Two further pieces of the server side:</p>
<ul>
<li><strong>Server threads</strong> &mdash; a call is handled by creating a new thread for each remote invocation. A server with several remote objects may allocate separate threads per object, so a slow call on one object does not block the others.</li>
<li><strong>The split of work</strong> &mdash; the server holds classes for dispatchers, skeletons and remote objects, an initialisation section that creates remote objects, and code that registers them with the binder; the client holds proxy classes for those objects and the binder lookup. A practical consequence: a client cannot create remote objects by calling constructors directly, so remote object creation goes through factory methods.</li>
</ul>

<h3>The remote interface</h3>
<p>The remote interface is the boundary of what can be invoked from outside, and two implementations of it matter here.</p>

<table class="comparison-table">
<thead>
<tr><th></th><th>CORBA</th><th>Java RMI</th></tr>
</thead>
<tbody>
<tr><td>How the remote interface is specified</td><td>An <strong>IDL</strong> (Interface Definition Language), which is language-neutral &mdash; the same interface can then be implemented in C++, Java or anything else.</td><td>The interface is extended with the Remote keyword: <code>public interface HelloInterface extends Remote</code>.</td></tr>
<tr><td><strong>Invocation semantics used</strong></td><td>At-most-once, <em>and</em> maybe semantics for methods that do not return a result.</td><td>At-most-once.</td></tr>
</tbody>
</table>

<p>The contrast is what each one buys. An IDL is language-neutral, so the interface is written once and implementations may be C++ on one machine and Java on another. Java RMI trades that neutrality for convenience, since the interface is ordinary Java with the <code>Remote</code> keyword, and in exchange both ends must be Java. The semantic row is the other half of the trade: CORBA permits <strong>maybe</strong> semantics for a method that returns no result, where the client does not wait for an acknowledgement and therefore cannot know whether the call happened. There is no result to bring back anyway.</p>

<h3>Design issues in RMI</h3>
<p>RMI shares RPC's design issues in three respects &mdash; programming with interfaces, call semantics and the level of transparency &mdash; and adds two of its own:</p>
<ol>
<li>Number of times the method is invoked in response to a single remote invocation &mdash; the invocation semantics.</li>
<li><strong>Level of location transparency</strong> &mdash; how much of the remoteness is hidden.</li>
</ol>

<table class="comparison-table">
<thead>
<tr><th>Invocation semantics</th><th>Guarantee and failure types</th></tr>
</thead>
<tbody>
<tr><td><strong>Exactly once</strong></td><td>Every method is executed exactly once &mdash; the ideal situation.</td></tr>
<tr><td><strong>Maybe</strong></td><td>The invoker cannot determine whether or not the remote method has been executed. <em>Omission failures</em> arise if the invocation or the result message is lost; <em>crash failures</em> when the server containing the remote object fails. Useful where an occasional failed invocation is acceptable.</td></tr>
<tr><td><strong>At-least-once</strong></td><td>The invoker either receives a result (so the method was executed at least once) or an exception. Retransmitting the request masks omission failures; crash failures still occur when the server fails. The hazard is arbitrary failure &mdash; the remote method is invoked more than once, so wrong values may be stored or returned &mdash; and the solution is to design the operations as idempotent.</td></tr>
<tr><td><strong>At-most-once</strong></td><td>The invoker either receives a result (and knows the method executed at most once) or an exception. All the fault-tolerance methods are used: omission failures are eliminated by retransmitting the request, and arbitrary failures are prevented by ensuring no method is executed more than once.</td></tr>
</tbody>
</table>

<div class="concept-box tip">
<h4>Which system uses which semantics</h4>
<p>Java RMI and CORBA use at-most-once semantics; CORBA also uses maybe semantics for methods that do not return results; SUNRPC provides at-least-once semantics.</p>
</div>

<h3>Location transparency</h3>
<p>Attempting full location transparency causes both failure and latency, because a remote invocation differs from a local one in ways the syntax does not show. Two solutions are named:</p>
<ul>
<li><strong>Exception handling</strong> &mdash; a remote call can fail in ways a local one cannot, so the language's error mechanism has to carry that.</li>
<li><strong>Different invocation semantics</strong> &mdash; accepting that a remote call is not a local call and choosing a weaker guarantee instead.</li>
</ul>
<div class="concept-box asked">
<h4>Access transparency against location transparency</h4>
<p><strong>Access transparency</strong> is that the same operation is used on a remote object as on a local one, and RPC delivers it. <strong>Location transparency</strong> is the stronger claim that the caller does not know <em>where</em> the object is. The stronger claim fails in practice, because a network's latency and its failure modes are part of the interface whether the designer admits it or not, and a call dressed up as a local one leaves the programmer no way to handle what actually happens. One solution carries the difference into the language, so every remote call can raise an exception; the other accepts it in the semantics and chooses a weaker guarantee knowingly (the at-most-once and maybe semantics). Real middleware takes the second road, which is why call semantics are a design decision rather than a detail.</p>
</div>

<h3>Java RMI case study</h3>
<p>Java RMI extends the Java object model to support distributed objects: objects invoke methods on remote objects with the same syntax as local invocations, and type checking applies equally to remote and local calls. Its costs are plain &mdash; it is a single-language system, and the programmer of a remote object has to consider that object's behaviour in a concurrent environment.</p>

<table class="comparison-table">
<thead>
<tr><th>File</th><th>Role</th><th>In the Hello example</th></tr>
</thead>
<tbody>
<tr><td><code>HelloInterface.java</code></td><td>The <strong>remote interface</strong> &mdash; defines the remote interface provided by the service. Usually a short statement specifying the service function.</td><td><code>public interface HelloInterface extends Remote</code> with <code>public String say(String msg) throws RemoteException;</code></td></tr>
<tr><td><code>Hello.java</code></td><td>The <strong>remote object</strong> implementing the remote service: a constructor and the required functions.</td><td><code>public class Hello extends UnicastRemoteObject implements HelloInterface</code> &mdash; <code>say</code> returns the input string reversed plus the server's own message.</td></tr>
<tr><td><code>HelloClient.java</code></td><td>The <strong>client</strong> that invokes the remote method.</td><td><code>HelloInterface hello = (HelloInterface) Naming.lookup(path);</code> then <code>hello.say(args[i])</code> &mdash; called like a local object.</td></tr>
<tr><td><code>HelloServer.java</code></td><td>The <strong>server</strong>: offers the remote service, installs a security manager, and contacts the <code>rmiregistry</code> with an instance of the service under the name of the remote object.</td><td><code>System.setSecurityManager(new RMISecurityManager());</code> then <code>Naming.rebind("Hello", new Hello("Hello, world!"));</code></td></tr>
</tbody>
</table>

<p>Four files make a Java RMI application, and they split one way: the interface says <em>what can be called</em>, the object says <em>what happens</em>.</p>

<h2>2.3 Message Passing and Serialization</h2>

<p>RPC and RMI hide the message. Two things sit underneath: the <strong>message-passing model</strong>, in which the programmer writes the sends and receives, and <strong>serialization</strong>, which is what makes it possible to put a structured value in a message at all.</p>

<h3>Shared memory versus distributed memory</h3>

<table class="comparison-table">
<thead>
<tr><th></th><th>Shared memory systems</th><th>Distributed memory systems</th></tr>
</thead>
<tbody>
<tr><td><strong>Model</strong></td><td>Processing elements (PE0&hellip;PEn) all see one data area.</td><td>Each PE has its own memory (Mem0&hellip;MemN) and they meet only on a NETWORK.</td></tr>
<tr><td><strong>Advantages</strong></td><td>Easy to parallelize, and all data is available nearby.</td><td>Locality of data is explicit, and it is cheap to build.</td></tr>
<tr><td><strong>Limitations</strong></td><td>Only practical up to certain system sizes &mdash; all of them must share one memory.</td><td>Data must be moved by explicit messages, so the programmer must think about what goes where.</td></tr>
</tbody>
</table>
<p>A shared-memory system is easier to program because everything is nearby &mdash; a data structure can simply be read and written &mdash; but it stops working past the size at which all processing elements can still reach one memory. A distributed-memory system scales by construction and pays for it by making <strong>locality explicit</strong>: data moves only when a message says so, so the programmer decides what moves, when and how much. </p>
<h3>The message-passing model</h3>
<ul>
<li><strong>Work unit</strong> &mdash; processes.</li>
<li><strong>Data units</strong> &mdash; decomposed, so each process has <em>its own</em> data unit; there is no shared data.</li>
<li><strong>Coordination</strong> &mdash; by exchanging <em>messages</em> through <code>send</code> and <code>recv</code> calls. The everyday analogy is mail.</li>
<li><strong>Hardware</strong> &mdash; typical clusters use an Ethernet or a more sophisticated network card and an interconnect, and messages are sent as packets over the network. The Network Interface Card (NIC) is the co-processor that handles this.</li>
</ul>
<p>The basic calls of a hypothetical message-passing system define the model: <code>send(int proc, int tag, int size, char *buf)</code> and a matching receive.</p>
<ul>
<li><strong>The return value</strong> &mdash; a receive may return the actual number of bytes received, in some systems.</li>
<li><strong>Wildcards</strong> &mdash; <code>tag</code> and <code>proc</code> may be wildcarded in a receive, so <code>recv(ANY, ANY, 1000, &amp;buf)</code> accepts a message from any source with any tag. A wildcarded receive is what lets a process act as a server, taking work from whoever asks, while a sender that names a specific <code>proc</code> and <code>tag</code> is addressing one peer.</li>
<li><strong>The buffer size</strong> &mdash; the call names a buffer and a size, so a program's correctness depends on both sides agreeing about layout in a way a local function call never has to.</li>
<li><strong>The tag</strong> &mdash; it is what lets one channel carry several conversations. A specific send paired with a wildcarded receive is the message-passing version of a request&ndash;reply interaction (2.1).</li>
</ul>
<h3>Collective calls and SPMD</h3>
<p>Message passing is often, but not always, used for <strong>SPMD</strong> style programming: <em>Single Program, Multiple Data</em>. All processors execute essentially the same program and the same steps, but not in lockstep. On top of the pairwise sends, SPMD programs need <strong>collective calls</strong>: global reductions such as max or sum, and broadcast, as in <code>syncBroadcast(whoAmI, dataSize, dataBuffer)</code>, where <code>whoAmI</code> identifies sender or receiver.</p>
<p>Two properties are easy to confuse. It is <em>one</em> program, not one program per processor: the same source runs everywhere, and each copy behaves differently because of the processor's own identity, which is why the collective call takes <code>whoAmI</code> as an argument. And the copies are not in lockstep, so a collective call is the only point at which the processes agree, which makes it a synchronisation as well as a movement of data. That is also the model's limit: the slowest participant sets the pace, so a program that relies on many collective calls spends its time waiting.</p>
<h3>MPI &mdash; the real message-passing system</h3>
<p>From the hypothetical interface, the real system is MPI (Message Passing Interface). Two calls bracket every MPI program: <code>MPI_Init(int argc, char **argv)</code> initialises the MPI library and <strong><code>MPI_Finalize()</code></strong> terminates its use, and all MPI calls must occur between them. A useful subset of six functions is enough to write many programs:</p>
<div class="formula-box lines">
<span class="fb-label">Core MPI Primitives</span>
<code>MPI_Init</code> / <code>MPI_Finalize</code>: Initialise and shut down the library; every other call lies between them.<br>
<code>MPI_Comm_size(comm, &amp;size)</code>: Determines <strong>the number of processes</strong>.<br>
<code>MPI_Comm_rank(comm, &amp;pid)</code>: <code>pid</code> is the process identifier of the caller &mdash; how a process knows which part of the work it owns.<br>
<code>MPI_Send(buf, count, datatype, dest, tag, comm)</code>: <code>buf</code> is the address of the send buffer, <code>count</code> the number of elements (&times; <code>sizeof(datatype)</code>), <code>datatype</code> the type of the elements, <code>dest</code> the destination process id, <code>tag</code> the message tag, <code>comm</code> the communicator.<br>
<code>MPI_Recv(buf, count, datatype, source, tag, comm, &amp;status)</code>: Mirror image: <code>count</code> is the <em>size of the receive buffer</em> in elements, <code>source</code> is a process id or <code>MPI_ANY_SOURCE</code>, and <code>status</code> reports what actually arrived.
</div>
<h3>What implementing message passing actually costs</h3>
<p>A send and a receive involve copying data from the user's data space on the source processor to the user's data space on the destination, with the MPI library in between to packetize it.</p>
<ul>
<li><strong>Data copying cost</strong> &mdash; copying into MPI buffers at both source and destination pays for the copy twice.</li>
<li><strong>Buffer availability</strong> &mdash; a send may block if no buffer is free at the receiver.</li>
<li><strong>Packetization</strong> &mdash; who pays attention to incoming packets, and where do they go?</li>
<li><strong>Tag matching</strong> &mdash; an arriving message must be matched to the receive that wants it.</li>
<li><strong>Progress engine</strong> &mdash; the machinery that keeps messages moving while the application does something else.</li>
</ul>
<p>Underneath, the transfer needs data transfer plus synchronisation: the receiver may have to answer <em>"may I send?"</em> with <em>"yes"</em> before the data moves. That requires the cooperation of sender and receiver, and the cooperation is not always apparent in the code &mdash; which is why message-passing programs are hard to debug.</p>
<h3>Messaging protocols: short, eager and rendezvous</h3>
<p>A message consists of an <strong>envelope (header)</strong> and data. The envelope carries the tag, communicator, length, source information and implementation-specific private data. MPI implementations often use different protocols for different messages, to trade performance against buffer memory.</p>
<table class="comparison-table">
<thead>
<tr><th>Protocol</th><th>How it works</th><th>Why choose it</th></tr>
</thead>
<tbody>
<tr><td><strong>Short</strong></td><td>The whole message fits in an internal buffer and is sent in one piece.</td><td>Lowest overhead for small messages.</td></tr>
<tr><td><strong>Eager</strong></td><td>The message is sent as soon as it is available, whether or not the receiver is ready &mdash; the sender does not wait.</td><td>Best latency, at the cost of buffering at the receiver.</td></tr>
<tr><td><strong>Rendezvous</strong></td><td>The <strong>header is sent first</strong> and the message is not sent until the destination sends an ok-to-send reply.</td><td>No large buffer needed and no risk of overrunning the receiver, at the cost of a round trip before the data moves.</td></tr>
</tbody>
</table>

<p>The three are one trade at three settings: how much buffer memory is spent to avoid waiting. A short message is the easy case, and the other two are about messages that do not fit. Eager sending keeps latency low by pushing the data at a receiver that may not have asked for it yet, so the receiver has to hold it; rendezvous asks first &mdash; the header goes, the receiver answers ok-to-send, and the data follows. One implementation uses all three, choosing per message.</p>

<h3>Persistence and synchronicity</h3>
<p>Five ideas matter here: a message can be stored and forwarded rather than discarded; the temporal relationship between data items decides how they are interpreted. A token bucket is how a stream is paced. A broker with conversion rules between a source and a destination client is messaging middleware; and the interleaving of two streams &mdash; a receiver reading two audio units for every video unit &mdash; is why synchronicity has to be specified rather than assumed.</p>
<p>The assumption underneath: applications run on hosts, each host is connected to one communication server, and buffers may be placed either on the hosts or in the communication servers of the underlying network &mdash; an e-mail system is the example.</p>
<table class="comparison-table">
<thead>
<tr><th>Dimension</th><th>Transient</th><th>Persistent</th></tr>
</thead>
<tbody>
<tr><td><strong>Persistence</strong> &mdash; how long a message survives</td><td>The message is discarded by a communication server as soon as it cannot be delivered at the next server or at the receiver. If the receiver is down, the message is lost.</td><td>The message is stored at a communication server as long as it takes to deliver it at the receiver, however long that is. The Pony Express is the illustration: mail is stored, sorted and sent on when a pony and rider are available.</td></tr>
<tr><td><strong>Synchronicity</strong> &mdash; what the sender waits for</td><td colspan="2">Asynchronous: the sender continues immediately after it has submitted its message for transmission. Synchronous: the sender is blocked until its message is stored in a local buffer at the receiving host, or actually delivered to the receiver.</td></tr>
</tbody>
</table>
<p>Client/server computing generally uses synchronous communication: the client and server must both be active at the time of communication, the client issues a request and blocks until a reply arrives, and the server waits for incoming requests and processes them. The drawbacks follow &mdash; the client can do no other work while waiting, and failures have to be dealt with immediately because the client is waiting &mdash; and for mail and news the model is simply not appropriate.</p>
<p>The message-oriented answer is a messaging interface in which <em>queued messages</em> are sent among processes, the sender is not stopped waiting for an immediate reply, and fault tolerance is often ensured by middleware rather than by the application. That is what persistent asynchronous communication makes possible.</p>
<h3>Serialization</h3>
<p>Every mechanism here has to put a structured value &mdash; a struct, an object, an array of floats &mdash; into a byte stream and reconstruct it at the other end.</p>

<table class="comparison-table">
<thead>
<tr><th>Term</th><th>Meaning</th><th>Where it appears</th></tr>
</thead>
<tbody>
<tr><td><strong>Marshalling</strong></td><td>Packaging arguments (or a result) into a message suitable for transmission.</td><td>Client stub step 2; server stub step 7.</td></tr>
<tr><td><strong>Unmarshalling</strong></td><td>Unpacking the message back into parameters or a return value.</td><td>Server stub step 5; client stub step 10.</td></tr>
<tr><td><strong>Serialization</strong></td><td>The general problem of converting an object or data structure into a form that can be stored or transmitted and reconstructed later &mdash; marshalling is serialization for the specific purpose of a call.</td><td>The Java socket example passes whole <code>Message</code> objects as serialized objects through <code>ObjectOutputStream</code>.</td></tr>
<tr><td><strong>Representation mismatch</strong></td><td>Two machines may disagree on how a value is laid out &mdash; byte order, integer width, floating-point format &mdash; so the serialized form has to be agreed.</td><td>The reason RPC's <em>non-flexible for hardware architectures</em> disadvantage exists, and why an IDL matters.</td></tr>
</tbody>
</table>

<div class="concept-box key">
<h4>Why call-by-reference is the problem</h4>
<p>A value can be copied into a message, but a <em>reference</em> means a pointer into one address space, and a pointer means nothing in another. Passing an object remotely therefore means either copying it (value) or passing a reference that the <em>remote reference module</em> must be able to resolve (2.2).</p>
</div>

<h2>2.4 Sockets and Web services (REST &amp; SOAP)</h2>

<h3>Sockets</h3>
<p>The client and server threads each hold an endpoint object bound to a local I/O port, and the client's socket also carries the destination address and the port number expected at the server. <code>XTI</code> is the transport interface used as the alternative to sockets on other systems, and the <code>MPI</code> send and receive calls are the message-passing primitives underneath the same idea. The Java TCP classes &mdash; <code>Socket</code> and <code>ServerSocket</code>, then a complete server example &mdash; are the concrete version of the mechanism.</p>
<p>Sockets are the low-level primitive under everything above. Communication channels are formed across a communications network with help from the operating system, each thread creates an <strong>endpoint object</strong> representing its end of the channel, and messages pass between the endpoints, across the channel. The client's socket specifies a local I/O port for sending messages (or the port is chosen by the operating system) and carries the address of the destination machine and the port number expected at the server's socket. The server's socket specifies a local I/O port for receiving messages, from any client that knows the server's machine address and that port number. The client asks the server to form a connection between the two sockets, and once the server accepts the request, messages pass in either direction across the channel.</p>
<p>The Java TCP implementation maps onto those four steps. <code>Socket</code> and <code>ServerSocket</code> are the two classes. On the client, <code>new Socket(host, serverPort)</code> creates a socket and requests a connection to the host, throwing <code>IOException</code> if it cannot connect. An <code>InputStream</code> and an <code>OutputStream</code> are then obtained from the socket, so reading and writing look like file I/O &mdash; <code>toServer.println("Hello")</code> and <code>fromServer.readLine()</code>. On the server, <code>new ServerSocket(serverPort)</code> is created once and then <code>accept()</code> waits until a client requests a connection and returns a <code>Socket</code> connecting that client to the server. The server gets its streams, communicates, then closes the connection and waits for the next request, and it can start a <code>clientHandler</code> thread on the returned socket so that each client is handled separately.</p>
<div class="concept-box warn">
<h4>Blocking reads</h4>
<p>A read on the input stream associated with a socket normally blocks. Setting <code>socket.setSoTimeout(1000)</code> gives a one-second timeout, after which a <code>SocketTimeoutException</code> is raised and the socket is still valid: a timeout means the peer did not answer in time, not that the channel is broken.</p>
</div>

<h3>Why web services exist</h3>
<p>The problem is sharing data between programs that were never designed to cooperate: data has to move between clients, a database and servers that sit behind firewalls, routers and switches, with security and compatibility constraints between them. A direct connection between the database and the clients is normally impossible over the Internet because of firewalls and the risk of attack, while the same connection inside a local network behind the firewall is normally fine.</p>
<p>The answer is a <strong>web service</strong>: a standard way to get data over a network using standard web protocols, chiefly HTTP, which is supported by every browser, server and most programming languages. HTTP is not the best possible transport so much as the one a firewall will let through. Formally, a web service is a method of communication between two devices over the World Wide Web, with standards defined by the W3C.</p>
<ul>
<li><strong>It is an API</strong> &mdash; a defined interface rather than a screen to click.</li>
<li><strong>It is cross-platform</strong> &mdash; it can be implemented and used in most programming languages: C#/ASP.NET, PHP, LabVIEW, Objective-C, Java.</li>
<li><strong>Standard protocols</strong> &mdash; HTTP, REST, SOAP, XML, WSDL, JSON.</li>
<li><strong>Why they became popular</strong> &mdash; easy data sharing over the Internet, platform-independent communication, integration of different systems and platforms, and distributed application development. Web services are the practical form of Service Oriented Architecture (SOA).</li>
</ul>
<h3>The two generations and their stacks</h3>
<p>Web Services 1.0 uses <strong>SOAP</strong>, the more complex of the two. Web Services 2.0 uses <strong>REST</strong> &mdash; less complex, lightweight and flexible, and the preferred model today. Each generation is a four-layer stack, and both sit on HTTP.</p>
<ul>
<li><strong>SOAP adds three layers</strong> &mdash; WSDL describes the API in machine-readable form, SOAP wraps every message in an XML envelope, and the payload is XML.</li>
<li><strong>REST collapses layers</strong> &mdash; the payload is usually JSON (XML is allowed) and the meta-information rides in the HTTP headers instead of a wrapper. There is often no machine-readable description at all; the optional WADL layer exists for completeness and is rarely used.</li>
<li><strong>What each buys</strong> &mdash; fewer layers to parse, fewer bytes on the wire and no tooling needed to read the interface make REST lightweight and flexible. The same missing contract makes it weaker where a service has to be described to a machine before it can be called.</li>
</ul>
<figure class="figure-wide figure-wrap">
<svg class="figure wide" viewBox="0 0 700 300" role="img" aria-label="Two four-layer stacks side by side: the SOAP stack is WSDL for API description, SOAP for messaging, XML for data and HTTP for transport; the REST stack is WADL for API description, REST for messaging, JSON or XML for data and HTTP for transport, with WADL marked optional">
<defs><marker id="f2c" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="flow-arrow-head"/></marker></defs>

<text class="flow-label" x="180" y="26" text-anchor="middle">Web Services 1.0 &mdash; SOAP</text>
<text class="flow-label" x="510" y="26" text-anchor="middle">Web Services 2.0 &mdash; REST</text>

<rect class="flow-box phase1" x="60" y="44" width="240" height="46" rx="9"/>
<text class="flow-text" x="180" y="72">WSDL &mdash; API description</text>
<rect class="flow-box phase2" x="60" y="100" width="240" height="46" rx="9"/>
<text class="flow-text" x="180" y="128">SOAP &mdash; messaging</text>
<rect class="flow-box phase3" x="60" y="156" width="240" height="46" rx="9"/>
<text class="flow-text" x="180" y="184">XML &mdash; data</text>
<rect class="flow-box phase4" x="60" y="212" width="240" height="46" rx="9"/>
<text class="flow-text" x="180" y="240">HTTP &mdash; transport</text>

<rect class="flow-box phase1" x="390" y="44" width="240" height="46" rx="9" opacity="0.45"/>
<text class="flow-text" x="510" y="66">WADL &mdash; API description</text>
<text class="flow-label" x="510" y="84" text-anchor="middle">completely optional, rarely used</text>
<rect class="flow-box phase2" x="390" y="100" width="240" height="46" rx="9"/>
<text class="flow-text" x="510" y="128">REST &mdash; messaging</text>
<rect class="flow-box phase3" x="390" y="156" width="240" height="46" rx="9"/>
<text class="flow-text" x="510" y="184">JSON / XML &mdash; data</text>
<rect class="flow-box phase4" x="390" y="212" width="240" height="46" rx="9"/>
<text class="flow-text" x="510" y="240">HTTP &mdash; transport</text>

<path class="flow-arrow" d="M180,90 V96" marker-end="url(#f2c)"/>
<path class="flow-arrow" d="M180,146 V152" marker-end="url(#f2c)"/>
<path class="flow-arrow" d="M180,202 V208" marker-end="url(#f2c)"/>
<path class="flow-arrow" d="M510,146 V152" marker-end="url(#f2c)"/>
<path class="flow-arrow" d="M510,202 V208" marker-end="url(#f2c)"/>
</svg>
<figcaption>Fig 2.3 &mdash; Both web-service stacks are four layers thick, and only the top three change. HTTP is the transport in both. SOAP puts an envelope around the message over XML; REST uses the HTTP headers to carry meta information and can be used with JSON or XML, usually JSON because it parses easily. The optional WADL layer is the reason a REST service is easier to consume by hand: there is often no machine-readable description at all.</figcaption>
</figure>
<h3>SOAP versus REST</h3>

<table class="comparison-table">
<thead>
<tr><th></th><th>SOAP web services</th><th>RESTful web services</th></tr>
</thead>
<tbody>
<tr><td><strong>Full name</strong></td><td><strong>Simple Object Access Protocol</strong></td><td><strong>Representational State Transfer</strong></td></tr>
<tr><td><strong>Messaging</strong></td><td><strong>SOAP envelopes the message.</strong><br><span class="muted">It runs on HTTP but wraps its own message inside the HTTP message.</span></td><td>Uses the HTTP headers to hold meta information.<br><span class="muted">The operation and the resource are expressed by the method and the URL.</span></td></tr>
<tr><td><strong>Data format</strong></td><td><strong>XML based.</strong></td><td>Can be used with XML, JSON or whatever is necessary.<br><span class="muted">Usually JSON because it is easily parsable.</span></td></tr>
<tr><td><strong>API description</strong></td><td><strong>WSDL</strong><br><span class="muted">A formal description of the service.</span></td><td><strong>WADL</strong><br><span class="muted">Completely optional and rarely used.</span></td></tr>
<tr><td><strong>HTTP methods</strong></td><td>Used mainly as a transport.<br><span class="muted">The operation is named inside the SOAP body.</span></td><td>Uses the standard HTTP methods.<br><span class="muted">GET, PUT, POST, DELETE &mdash; as the operations themselves.</span></td></tr>
<tr><td><strong>Speed</strong></td><td><strong>Slower than REST.</strong><br><span class="muted">Because of the envelope and XML processing.</span></td><td><strong>Faster than SOAP.</strong></td></tr>
<tr><td>Maturity and fit</td><td>Very mature, a lot of functionality.<br><span class="muted">But not suitable for browser-based clients and more complicated to use.</span></td><td>Lightweight and flexible.<br><span class="muted">The preferred model today.</span></td></tr>
<tr><td><strong>Example tooling</strong></td><td>Visual Studio: ASP.NET ASMX Web Service.<br><span class="muted">Consumed by importing a WSDL URL.</span></td><td>Visual Studio: ASP.NET Web API.</td></tr>
</tbody>
</table>

<div class="example-box">
<h4>Example: Consuming a SOAP Service</h4>
<p>Public services are available to try, such as <code>tempconvert.asmx?WSDL</code>. Consuming one means importing the WSDL URL in the tooling and then picking methods such as <code>CelsiusToFahrenheit</code> and <code>FahrenheitToCelsius</code> from the machine-readable description.</p>
</div>
<div class="concept-box tip">
<h4>The three differences, and the two consequences</h4>
<p>Three differences change how code is written: the envelope against the HTTP headers, XML only against JSON or XML, and WSDL as a required description against WADL as an optional one. Two consequences follow: REST is faster and works in a browser, while SOAP is more mature and carries more functionality.</p>
</div>
<h3>A 3-tier architecture with a web service</h3>
<p>The worked example puts the pieces together as web server &rarr; web services &rarr; business logic &rarr; data source, split into a <strong>presentation</strong> layer, a <strong>logic</strong> layer and a <strong>foundations</strong> layer, installed on one or more servers in your LAN or in the cloud.</p>
<!-- dcc-fig:ch2/rest-soap-webservices-lecture-p08.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/rest-soap-webservices-lecture-p08.webp" alt="The three-tier running example: the client, the web-service application tier, and behind it the data source and the server software, installed on one or more servers in the LAN or in the cloud." width="1241" height="1755" loading="lazy" decoding="async">
<figcaption>The three-tier running example: the client, the web-service application tier, and behind it the data source and the server software, installed on one or more servers in the LAN or in the cloud.</figcaption>
</figure>
<!-- /dcc-fig -->
<p>The layers are the three tiers with the middle one exposed to the network. The presentation layer is the client &mdash; a browser, or another program calling the API. The logic layer holds the web service and the business logic behind it. The foundations layer holds the data source and the server software the example installs, with the stored procedures living in the database rather than in the application. Once the application tier can be reached as a web service over an ordinary HTTP connection, whether the machine behind that connection is your own or a provider's stops mattering, and a design that cannot tell the difference can run anywhere.</p>
<p class="past-pointer">Questions on this unit, with model answers, are on the <a href="#/ch/2/past">Past Questions</a> tab.</p>

`,

  revise: {"2.0":"<p><strong>Distributed objects</strong> are objects in different address spaces that share data and invoke each other's methods.</p>\n<ul>\n<li>The <em>objects</em> are the communicating entities, not raw bytes.</li>\n<li><strong>Location transparency</strong> is what the abstraction buys, and why distributed objects communicate by <strong>RMI</strong>.</li>\n<li>A local object and a distributed object are not equivalent.</li>\n</ul>","where-a-local-object-and-a-distributed-object-differ":"<p>Six areas separate a local object from a distributed one:</p>\n<ul>\n<li><strong>Reference</strong> &mdash; one machine word locally; it must be meaningful in another address space remotely.</li>\n<li><strong>Request latency</strong> &mdash; every call crosses a network, and it is variable.</li>\n<li><strong>Object activation</strong> &mdash; the object may not be instantiated yet.</li>\n<li><strong>Parallelism</strong> &mdash; calls can arrive from several clients at once.</li>\n<li><strong>Failure</strong> &mdash; partial failure, which produces the whole of call semantics.</li>\n<li><strong>Security</strong> &mdash; the operating system no longer enforces it; the middleware does.</li>\n</ul>","2.1":"<p><strong>RPC</strong>: the client invokes a procedure that resides remotely, the server executes it and returns the result, and the caller is <strong>blocked</strong> until the reply arrives.</p>\n<ul>\n<li>Built on the single-process procedure-call model, so it is a high-level interface.</li>\n<li>The server exposes a <strong>service interface</strong> and works under a <strong>request&ndash;reply protocol</strong>: the request names a procedure, not an object.</li>\n<li>Simple RPC does not keep <strong>access transparency</strong>; the stub layer fixes that.</li>\n</ul>","2.2":"<p><strong>RMI</strong>: method invocation between objects in different processes. Objects that receive remote invocations are <strong>remote objects</strong>.</p>\n<ul>\n<li>Where RPC invokes a procedure by name and drops the object reference, RMI keeps the object.</li>\n<li>The caller holds a reference to an object in another process and calls a method on it.</li>\n<li>That difference is what forces the proxy, the skeleton and the remote reference module.</li>\n</ul>","2.3":"<p>RPC and RMI hide the message. Two mechanisms sit underneath them: the <strong>message-passing model</strong>, where the programmer writes the sends and receives, and <strong>serialization</strong>, which lets a structured value go into a message at all.</p>","how-rpc-works-in-ten-steps":"<p>Ten steps: 1&ndash;3 client, 4&ndash;7 server, 8&ndash;10 reply. The client procedure is blocked from step 1 until the reply arrives.</p>\n<ul>\n<li><strong>Marshalling</strong> &mdash; step 2: the client stub packs the parameters and the procedure name into a message.</li>\n<li><strong>Unmarshalling</strong> &mdash; step 5: the server stub unpacks them and calls the server.</li>\n<li>Neither procedure knows it crossed a network.</li>\n</ul>","advantages-and-disadvantages":"<p>Four benefits and three costs, and each benefit is bought with its matching cost.</p>\n<ul>\n<li>Benefits: the procedure runs in another process or on another machine; process and thread models; <strong>access transparency</strong> with a complete stub layer; code reusability.</li>\n<li>Costs: <strong>call-by-value</strong> and <strong>call-by-reference</strong> only; overheads of marshalling, the round trip and kernel calls; both ends must agree the representation.</li>\n</ul>","rpc-issues-the-five-things-that-go-wrong":"<p>Five RPC faults, each with the mechanism that answers it:</p>\n<ul>\n<li>The server cannot be located &rarr; a naming or binder service.</li>\n<li>Lost request &rarr; retransmit after a timeout.</li>\n<li>Lost reply &rarr; retransmit, or keep a history of results.</li>\n<li>Server crash &rarr; duplicate filtering and idempotent operation design.</li>\n<li>Client crash &rarr; the orphan call is detected and discarded.</li>\n</ul>\n<p>Under these faults, call semantics decide when and how often a procedure is executed.</p>","call-semantics":"<p>Five semantics, from the ideal to the cheapest; the repair for repeats is an <strong>idempotent</strong> operation.</p>\n<ul>\n<li><strong>Exactly once</strong> &mdash; the ideal: time-outs, retransmission, one call identifier, a cache at the callee.</li>\n<li><strong>At most once</strong>, also called <strong>maybe</strong> &mdash; once or not at all, and the client cannot tell which.</li>\n<li><strong>At least once</strong> &mdash; one or more times; safe only when repeating is harmless.</li>\n<li><strong>Last once</strong> &mdash; the most recent call's result counts.</li>\n<li><strong>Last-of-many</strong> &mdash; accepted only if the identifier matches the newest call; orphans neglected.</li>\n</ul>","providing-a-reliable-request-reply-protocol":"<p>Three fault-tolerant measures, each a decision with a cost:</p>\n<ul>\n<li><strong>Retry request message</strong> &mdash; costs the at-least-once hazard.</li>\n<li><strong>Duplicate filtering</strong> &mdash; costs state and time at the server.</li>\n<li><strong>Retransmission of results</strong> &mdash; costs stored results.</li>\n</ul>\n<p>The third is the fix for a lost reply: the work was already done, so re-executing is exactly wrong.</p>","what-a-remote-invocation-requires":"<p>Three requirements, in the order a remote invocation meets them:</p>\n<ul>\n<li>A <strong>remote object reference</strong> for the object.</li>\n<li>A <strong>remote interface</strong> &mdash; only its methods can be invoked from outside; everything else is private to the process.</li>\n<li>A <strong>remote object</strong>: the class implements it, with the implementation separated from what is exposed.</li>\n</ul>","the-rmi-software":"<p>Five roles to name when explaining RMI's architecture:</p>\n<ul>\n<li><strong>Proxy</strong> &mdash; marshals arguments, forwards, receives, unmarshals; from the client's side it is the object.</li>\n<li><strong>Dispatcher</strong> &mdash; receives requests and selects the correct method.</li>\n<li><strong>Skeleton</strong> &mdash; unmarshals, invokes the method, marshals the result.</li>\n<li><strong>Remote reference module</strong> &mdash; translates local to remote references and keeps the remote object table.</li>\n<li><strong>Binder</strong> &mdash; maps textual names to remote object references; servers register, clients look up.</li>\n</ul>","the-remote-interface":"<p>The remote interface is the boundary of what can be invoked from outside. The contrast is what each one buys:</p>\n<ul>\n<li><strong>CORBA</strong> &mdash; an <strong>IDL</strong>, language-neutral, so implementations may be C++ or Java. At-most-once semantics, and maybe for methods with no result.</li>\n<li><strong>Java RMI</strong> &mdash; the interface extends <strong>Remote</strong>; convenient, but both ends must be Java. At-most-once semantics.</li>\n</ul>","design-issues-in-rmi":"<p>RMI shares RPC's issues in three respects &mdash; interfaces, call semantics, transparency &mdash; and adds two: the invocation semantics, and how much remoteness to hide.</p>\n<ul>\n<li><strong>Exactly once</strong> &mdash; the ideal.</li>\n<li><strong>Maybe</strong> &mdash; the invoker cannot tell whether it ran.</li>\n<li><strong>At-least-once</strong> &mdash; a result or an exception; the hazard is arbitrary failure, repaired by <strong>idempotent</strong> operations.</li>\n<li><strong>At-most-once</strong> &mdash; a result or an exception, with nothing executed twice.</li>\n</ul>\n<p>Java RMI and CORBA: at-most-once. CORBA also: maybe. SUNRPC: at-least-once.</p>","location-transparency":"<p>Full location transparency causes failure and latency, because a remote invocation differs from a local one.</p>\n<ul>\n<li><strong>Access transparency</strong> &mdash; the same operation is used on a remote object as on a local one. RPC delivers this.</li>\n<li><strong>Location transparency</strong> &mdash; the caller does not know where the object is. This is the claim that fails in practice.</li>\n<li>Two repairs: carry the difference into the language as exceptions, or choose a weaker invocation semantics deliberately.</li>\n</ul>","java-rmi-case-study":"<p><strong>Java RMI</strong> extends the Java object model to distributed objects: remote methods are called with local syntax and type checking applies equally. Its costs: single-language, and the object's behaviour under concurrency must be considered.</p>\n<ul>\n<li><strong>HelloInterface.java</strong> &mdash; the remote interface, <code>extends Remote</code>.</li>\n<li><strong>Hello.java</strong> &mdash; the remote object, <code>extends UnicastRemoteObject implements HelloInterface</code>.</li>\n<li><strong>HelloClient.java</strong> &mdash; <code>Naming.lookup</code>, then <code>say</code> called like a local object.</li>\n<li><strong>HelloServer.java</strong> &mdash; installs the security manager and rebinds with the rmiregistry.</li>\n</ul>","shared-memory-versus-distributed-memory":"<p>Two memory models, each with one advantage and one limit:</p>\n<ul>\n<li><strong>Shared memory</strong> &mdash; all processing elements see one data area. Easy to parallelise; practical only up to a certain system size.</li>\n<li><strong>Distributed memory</strong> &mdash; each element has its own memory and they meet only on a network. Locality is explicit and it is cheap to build; data moves only when a message says so.</li>\n</ul>","the-message-passing-model":"<p>The model: the work unit is the process, data units are decomposed with <em>no shared data</em>, and coordination is by <code>send</code> and <code>recv</code>. The analogy is mail.</p>\n<ul>\n<li>Two details of the signature: <code>recv</code> may report the number of bytes received, and <code>tag</code> and <code>proc</code> may be <strong>wildcarded</strong>.</li>\n<li>A specific send paired with a wildcarded receive is the request&ndash;reply interaction of 2.1.</li>\n</ul>","collective-calls-and-spmd":"<p><strong>SPMD</strong> &mdash; Single Program, Multiple Data: all processors run the same program, but not in lockstep.</p>\n<ul>\n<li>It is one program, not one per processor: each copy behaves differently from its own identity, passed in as an argument.</li>\n<li>Collective calls add <strong>global reductions</strong> such as max and sum, and <strong>broadcast</strong>.</li>\n<li>A collective call is also a synchronisation, so the slowest participant sets the pace.</li>\n</ul>","mpi-the-real-message-passing-system":"<p><strong>MPI</strong> is the real message-passing system. Every program is bracketed by <code>MPI_Init</code> and <code>MPI_Finalize</code>, and all calls lie between them.</p>\n<ul>\n<li><code>MPI_Comm_size</code> &mdash; the number of processes.</li>\n<li><code>MPI_Comm_rank</code> &mdash; which part of the work this process owns.</li>\n<li><code>MPI_Send</code> and <code>MPI_Recv</code> &mdash; buffer, count, datatype, destination or source, tag, communicator.</li>\n</ul>","what-implementing-message-passing-actually-costs":"<p>A send and a receive copy data from the user's space on one processor to the user's space on another, with the MPI library in between to packetize it. The known costs:</p>\n<ul>\n<li><strong>Data copying</strong> &mdash; paid twice, into buffers at both ends.</li>\n<li><strong>Buffer availability</strong> &mdash; a send may block if no buffer is free at the receiver.</li>\n<li><strong>Packetization</strong>, <strong>tag matching</strong>, and a <strong>progress engine</strong>.</li>\n<li>Transfer needs <strong>synchronisation</strong>: the receiver may have to answer &ldquo;may I send?&rdquo; before the data moves.</li>\n</ul>","messaging-protocols-short-eager-and-rendezvous":"<p>A message is an <strong>envelope</strong> &mdash; tag, communicator, length, source &mdash; plus data. Three protocols, trading buffer memory against waiting:</p>\n<ul>\n<li><strong>Short</strong> &mdash; the whole message fits in an internal buffer; lowest overhead.</li>\n<li><strong>Eager</strong> &mdash; sent as soon as it is available, whether or not the receiver is ready; best latency, at the cost of buffering.</li>\n<li><strong>Rendezvous</strong> &mdash; the header goes first and the data follows only after an ok-to-send reply; no large buffer, at the cost of a round trip.</li>\n</ul>\n<p>One implementation uses all three, choosing per message.</p>","persistence-and-synchronicity":"<p><strong>Persistence</strong> and <strong>synchronicity</strong> decide how a message is handled. Both assume applications run on <strong>hosts</strong>, one connection each to a <strong>communication server</strong>, with buffers on the hosts or in the servers.</p>\n<ul>\n<li><strong>Transient</strong> &mdash; discarded if it cannot be delivered now; <strong>persistent</strong> &mdash; stored until the receiver can take it.</li>\n<li><strong>Asynchronous</strong> &mdash; the sender continues immediately; <strong>synchronous</strong> &mdash; it blocks until the message is buffered or delivered.</li>\n<li>Client/server computing is synchronous: the client cannot work while it waits. <strong>Queued messages</strong> are the answer.</li>\n</ul>","serialization":"<p>Every mechanism here has to put a structured value into a byte stream and rebuild it at the other end.</p>\n<ul>\n<li><strong>Marshalling</strong> &mdash; packaging arguments or a result into a message: step 2 on the client, step 7 on the server.</li>\n<li><strong>Unmarshalling</strong> &mdash; unpacking it: step 5, step 10.</li>\n<li><strong>Serialization</strong> &mdash; the general problem; marshalling is serialization for a call.</li>\n<li><strong>Representation mismatch</strong> &mdash; byte order, integer width and float format must be agreed, which is why an <strong>IDL</strong> matters.</li>\n<li>A value can be copied; a pointer cannot &mdash; RPC's call-by-reference disadvantage.</li>\n</ul>","sockets":"<p>Sockets are the primitive under everything above: channels made across a network with the operating system's help, each thread creating an <strong>endpoint</strong> at its end.</p>\n<ul>\n<li>The client's socket names a local I/O <strong>port</strong>, the destination machine, and the port bound to the server.</li>\n<li>The server's socket names a local port; the client requests a connection, the server accepts it.</li>\n<li>Java: <code>Socket</code> and <code>ServerSocket</code>, with streams so reading and writing look like file I/O.</li>\n<li>A read normally <strong>blocks</strong>; <code>setSoTimeout</code> gives a timeout, after which the socket stays valid.</li>\n</ul>","why-web-services-exist":"<p>The problem: the clients, the database and the servers sit behind firewalls, so a direct connection over the Internet is normally not possible. A <strong>web service</strong> is the standard way to get data over standard web protocols, chiefly <strong>HTTP</strong>.</p>\n<ul>\n<li>It is not that HTTP is the best transport; it is what a firewall will let through.</li>\n<li>Properties: it is an <strong>API</strong>, cross-platform, implementable in most languages, and built on standard web technology.</li>\n<li>The standards are defined by the <strong>W3C</strong>.</li>\n</ul>","the-two-generations-and-their-stacks":"<p>Web Services 1.0 uses <strong>SOAP</strong>; Web Services 2.0 uses <strong>REST</strong>. Both stacks sit on HTTP, and only the top three layers change:</p>\n<ul>\n<li><strong>SOAP</strong>: WSDL describes the API in machine-readable form, SOAP wraps each message in an XML envelope, the payload is XML.</li>\n<li><strong>REST</strong>: the payload is usually JSON, the meta-information rides in the HTTP headers, and WADL is completely optional and rarely used.</li>\n</ul>\n<p>Fewer layers to parse and no contract to read make REST lightweight; the missing contract is what it gives up.</p>","soap-versus-rest":"<p>SOAP envelopes its own message inside the HTTP message; REST uses the standard HTTP methods &mdash; GET, PUT, POST, DELETE &mdash; as the operations, with meta-information in the headers.</p>\n<ul>\n<li>Data: SOAP is XML-based; REST is used with XML, JSON or whatever is necessary, usually JSON.</li>\n<li>Description: <strong>WSDL</strong> is required; <strong>WADL</strong> is optional and rarely used.</li>\n<li>Speed: REST is faster. Maturity: SOAP carries more functionality, but is not suitable for browser-based clients.</li>\n</ul>","a-3-tier-architecture-with-a-web-service":"<p>The worked example: <strong>web server &rarr; web services &rarr; business logic &rarr; data source</strong>, in a presentation, a logic and a foundations layer, installed on one or more servers in your LAN or in the cloud.</p>\n<ul>\n<li>The application tier is exposed to the world as an API.</li>\n<li>Because the tier is reached over ordinary HTTP, where that tier runs stops mattering.</li>\n</ul>"},
  pastSummary: `<h2>Exam-facing summary</h2>
<table class="comparison-table">
<thead>
<tr><th>If the question says&hellip;</th><th>Give&hellip;</th></tr>
</thead>
<tbody>
<tr><td>Describe RPC with its working mechanism</td><td>The definition, then Fig 2.1's ten steps with <em>marshalling</em> named at step 2 and <em>unmarshalling</em> at step 5, then the request&ndash;reply protocol and the service interface.</td></tr>
<tr><td>What can go wrong in RPC / discuss RPC issues</td><td>The five faults (locate failure, lost request, lost reply, server crash, client crash) and then call semantics as the answer to them.</td></tr>
<tr><td>Explain call/invocation semantics</td><td>Exactly once, at-most-once (maybe), at-least-once, last once, last-of-many &mdash; with the fault each one tolerates and the cost it accepts. Name idempotency.</td></tr>
<tr><td>Explain the implementation/architecture of RMI</td><td>Proxy, dispatcher, skeleton, remote reference module, binder &mdash; plus the remote interface and the remote object reference, and Fig 2.2.</td></tr>
<tr><td>Compare RPC and RMI</td><td>Procedure versus object method; no object reference in the request versus a remote object reference; both use stubs; RMI adds a proxy, a skeleton and a binder; the same semantics family applies to both.</td></tr>
<tr><td>Explain message passing / MPI</td><td>Processes and their own data units, no shared data, send/recv with tag and wildcards, SPMD and collectives, the MPI six, and the costs (copying, buffering, tag matching).</td></tr>
<tr><td>Differentiate persistent and transient, or synchronous and asynchronous communication</td><td>The table, with e-mail as persistent and client/server request&ndash;reply as synchronous, and the three drawbacks of the synchronous model.</td></tr>
<tr><td>Explain sockets</td><td>Endpoint objects, the client's socket naming host and destination port, the server's socket on a local port, connect and accept, then two-way messages; <code>Socket</code>/<code>ServerSocket</code> and the blocking read with <code>setSoTimeout</code>.</td></tr>
<tr><td>Compare SOAP and REST web services</td><td>Fig 2.3 plus the table &mdash; envelope versus headers, XML versus JSON, WSDL versus optional WADL, and the speed and browser-support consequences.</td></tr>
</tbody>
</table>


`,

  slides: `
<h2>The teacher's slides for this unit</h2>
<p class="ref-intro">These are the pictures that came with this unit &mdash; the class deck, the reference notes and the pages handed out with them &mdash; collected here so that the notes above read as writing rather than as a pile of screenshots. Each group is headed by the section of the notes its pictures belong to, in that order, and names the file and the slides they came from. The diagrams the notes themselves need are drawn in the notes.</p>

<h3>2.1 Remote Procedure Calls (RPC)</h3>

<p class="ref-meta">From <em>LectureMain_Ch_2_Communication_in_DS.pptx</em>, slide 6.</p>

<!-- dcc-fig:ch2/lecturemain-ch-2-communication-in-ds-s06-009.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/lecturemain-ch-2-communication-in-ds-s06-009.webp" alt="The client blocks on a call that looks local and is not: the request travels to the server and the reply comes back, and everything the caller does not see is the two trips." width="827" height="411" loading="lazy" decoding="async">
<figcaption>Principle of RPC between a client and server program.</figcaption>
</figure>
<!-- /dcc-fig -->
<p class="ref-why">The client blocks on a call that looks local and is not: the request travels to the server and the reply comes back, and everything the caller does not see is the two trips.</p>

<h3>How RPC works in ten steps</h3>

<p class="ref-meta">From <em>LectureMain_Ch_2_Communication_in_DS.pptx</em>, <em>MessagePassing_refnote2.pdf</em>, slides 7 and 9.</p>

<!-- dcc-fig:ch2/lecturemain-ch-2-communication-in-ds-s07-010.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/lecturemain-ch-2-communication-in-ds-s07-010.webp" alt="Count the ten steps between the client functions and the server functions - the call goes down both stubs and both kernels before any work happens, and the reply retraces the same ten in reverse." width="719" height="307" loading="lazy" decoding="async">
<figcaption>How modern RPC works?</figcaption>
</figure>
<!-- /dcc-fig -->
<p class="ref-why">Count the ten steps between the client functions and the server functions - the call goes down both stubs and both kernels before any work happens, and the reply retraces the same ten in reverse.</p>

<!-- dcc-fig:ch2/messagepassing-refnote2-p09.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/messagepassing-refnote2-p09.webp" alt="Message queuing rather than message waiting: the sender writes into a queue it owns and returns, and the network carries the message across later - the channel attributes below list what that transfer has to decide." width="1240" height="1755" loading="lazy" decoding="async">
<figcaption>Page from the notes on How RPC works in ten steps</figcaption>
</figure>
<!-- /dcc-fig -->
<p class="ref-why">Message queuing rather than message waiting: the sender writes into a queue it owns and returns, and the network carries the message across later - the channel attributes below list what that transfer has to decide.</p>

<h3>Providing a reliable request–reply protocol</h3>

<p class="ref-meta">From <em>LectureMain_Ch_2_Communication_in_DS.pptx</em>, slide 22.</p>

<!-- dcc-fig:ch2/lecturemain-ch-2-communication-in-ds-s22-015.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/lecturemain-ch-2-communication-in-ds-s22-015.webp" alt="What the three fault-tolerance measures buy: no retry and no duplicate filtering is only &#x27;Maybe&#x27;; retrying without filtering re-executes for at-least-once; adding duplicate filtering gives at-most-once." width="972" height="456" loading="lazy" decoding="async">
<figcaption>Providing reliable request-reply protocol</figcaption>
</figure>
<!-- /dcc-fig -->
<p class="ref-why">What the three fault-tolerance measures buy: no retry and no duplicate filtering is only 'Maybe'; retrying without filtering re-executes for at-least-once; adding duplicate filtering gives at-most-once.</p>

<h3>2.2 Remote Method Invocation (RMI)</h3>

<p class="ref-meta">From <em>LectureMain_Ch_2_Communication_in_DS.pptx</em>, slide 14.</p>

<!-- dcc-fig:ch2/lecturemain-ch-2-communication-in-ds-s14-012.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/lecturemain-ch-2-communication-in-ds-s14-012.webp" alt="Implementation of RMI/Architecture" width="897" height="393" loading="lazy" decoding="async">
<figcaption>Implementation of RMI/Architecture</figcaption>
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/lecturemain-ch-2-communication-in-ds-s14-013.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/lecturemain-ch-2-communication-in-ds-s14-013.webp" alt="Implementation of RMI/Architecture" width="1160" height="651" loading="lazy" decoding="async">
<figcaption>Implementation of RMI/Architecture</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>What a remote invocation requires</h3>

<p class="ref-meta">From <em>LectureMain_Ch_2_Communication_in_DS.pptx</em>, slide 18.</p>

<!-- dcc-fig:ch2/lecturemain-ch-2-communication-in-ds-s18-014.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/lecturemain-ch-2-communication-in-ds-s18-014.webp" alt="Remote Object and its Remote Interface" width="1126" height="425" loading="lazy" decoding="async">
<figcaption>Remote Object and its Remote Interface</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>Shared memory versus distributed memory</h3>

<p class="ref-meta">From <em>LectureMain_Ch_2_Communication_in_DS.pptx</em>, slides 30&ndash;31.</p>

<!-- dcc-fig:ch2/lecturemain-ch-2-communication-in-ds-s30-016.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/lecturemain-ch-2-communication-in-ds-s30-016.webp" alt="Message Passing" width="1097" height="587" loading="lazy" decoding="async">
<figcaption>Message Passing</figcaption>
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/lecturemain-ch-2-communication-in-ds-s31-017.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/lecturemain-ch-2-communication-in-ds-s31-017.webp" alt="Illustration for Shared memory versus distributed memory" width="1063" height="567" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>The message-passing model</h3>

<p class="ref-meta">From <em>LectureMain_Ch_2_Communication_in_DS.pptx</em>, slides 32&ndash;34.</p>

<!-- dcc-fig:ch2/lecturemain-ch-2-communication-in-ds-s32-018.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/lecturemain-ch-2-communication-in-ds-s32-018.webp" alt="Illustration for The message-passing model" width="1116" height="392" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/lecturemain-ch-2-communication-in-ds-s32-019.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/lecturemain-ch-2-communication-in-ds-s32-019.webp" alt="Illustration for The message-passing model" width="951" height="363" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/lecturemain-ch-2-communication-in-ds-s33-020.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/lecturemain-ch-2-communication-in-ds-s33-020.webp" alt="Message passing: send copies the data out of the sender's buffer and receive delivers…" width="1038" height="542" loading="lazy" decoding="async">
<figcaption>Message passing: send copies the data out of the sender's buffer and receive delivers…</figcaption>
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/lecturemain-ch-2-communication-in-ds-s34-021.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/lecturemain-ch-2-communication-in-ds-s34-021.webp" alt="Illustration for The message-passing model" width="1032" height="469" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>Collective calls and SPMD</h3>

<p class="ref-meta">From <em>LectureMain_Ch_2_Communication_in_DS.pptx</em>, slide 35.</p>

<!-- dcc-fig:ch2/lecturemain-ch-2-communication-in-ds-s35-022.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/lecturemain-ch-2-communication-in-ds-s35-022.webp" alt="Illustration for Collective calls and SPMD" width="1068" height="517" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>MPI — the real message-passing system</h3>

<p class="ref-meta">From <em>LectureMain_Ch_2_Communication_in_DS.pptx</em>, slides 36&ndash;39.</p>

<!-- dcc-fig:ch2/lecturemain-ch-2-communication-in-ds-s36-023.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/lecturemain-ch-2-communication-in-ds-s36-023.webp" alt="Basic MPI sending and receiving messages: each process names its peer and a tag, and the…" width="742" height="260" loading="lazy" decoding="async">
<figcaption>Basic MPI sending and receiving messages: each process names its peer and a tag, and the…</figcaption>
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/lecturemain-ch-2-communication-in-ds-s37-024.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/lecturemain-ch-2-communication-in-ds-s37-024.webp" alt="Illustration for MPI — the real message-passing system" width="870" height="364" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/lecturemain-ch-2-communication-in-ds-s37-025.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/lecturemain-ch-2-communication-in-ds-s37-025.webp" alt="Illustration for MPI — the real message-passing system" width="852" height="392" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/lecturemain-ch-2-communication-in-ds-s38-026.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/lecturemain-ch-2-communication-in-ds-s38-026.webp" alt="Illustration for MPI — the real message-passing system" width="726" height="299" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/lecturemain-ch-2-communication-in-ds-s38-027.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/lecturemain-ch-2-communication-in-ds-s38-027.webp" alt="Illustration for MPI — the real message-passing system" width="1100" height="522" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/lecturemain-ch-2-communication-in-ds-s39-028.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/lecturemain-ch-2-communication-in-ds-s39-028.webp" alt="Illustration for MPI — the real message-passing system" width="894" height="473" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>What implementing message passing actually costs</h3>

<p class="ref-meta">From <em>LectureMain_Ch_2_Communication_in_DS.pptx</em>, <em>MessagePassing_refnote2.pdf</em>, slides 7 and 40&ndash;42.</p>

<!-- dcc-fig:ch2/lecturemain-ch-2-communication-in-ds-s41-030.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/lecturemain-ch-2-communication-in-ds-s41-030.webp" alt="Illustration for What implementing message passing actually costs" width="832" height="490" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/lecturemain-ch-2-communication-in-ds-s41-031.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/lecturemain-ch-2-communication-in-ds-s41-031.webp" alt="Illustration for What implementing message passing actually costs" width="757" height="505" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/lecturemain-ch-2-communication-in-ds-s40-029.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/lecturemain-ch-2-communication-in-ds-s40-029.webp" alt="Illustration for What implementing message passing actually costs" width="730" height="221" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/lecturemain-ch-2-communication-in-ds-s42-032.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/lecturemain-ch-2-communication-in-ds-s42-032.webp" alt="Illustration for What implementing message passing actually costs" width="944" height="511" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/lecturemain-ch-2-communication-in-ds-s42-033.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/lecturemain-ch-2-communication-in-ds-s42-033.webp" alt="Illustration for What implementing message passing actually costs" width="1070" height="272" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/messagepassing-refnote2-p07.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/messagepassing-refnote2-p07.webp" alt="Page from the notes on What implementing message passing actually costs" width="1240" height="1755" loading="lazy" decoding="async">
<figcaption>Page from the notes on What implementing message passing actually costs</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>Messaging protocols: short, eager and rendezvous</h3>

<p class="ref-meta">From <em>LectureMain_Ch_2_Communication_in_DS.pptx</em>, slide 43.</p>

<!-- dcc-fig:ch2/lecturemain-ch-2-communication-in-ds-s43-034.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/lecturemain-ch-2-communication-in-ds-s43-034.webp" alt="Illustration for Messaging protocols: short, eager and rendezvous" width="1082" height="545" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>Persistence and synchronicity</h3>

<p class="ref-meta">From <em>MessagePassing_refnote2.pdf</em>, slides 2&ndash;3, 6, 8, 11 and 13&ndash;14.</p>

<!-- dcc-fig:ch2/messagepassing-refnote2-p08.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/messagepassing-refnote2-p08.webp" alt="Page from the notes on Persistence and synchronicity" width="1240" height="1755" loading="lazy" decoding="async">
<figcaption>Page from the notes on Persistence and synchronicity</figcaption>
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/messagepassing-refnote2-p11.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/messagepassing-refnote2-p11.webp" alt="Page from the notes on Persistence and synchronicity" width="1240" height="1755" loading="lazy" decoding="async">
<figcaption>Page from the notes on Persistence and synchronicity</figcaption>
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/messagepassing-refnote2-p13.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/messagepassing-refnote2-p13.webp" alt="Page from the notes on Persistence and synchronicity" width="1240" height="1755" loading="lazy" decoding="async">
<figcaption>Page from the notes on Persistence and synchronicity</figcaption>
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/messagepassing-refnote2-p03.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/messagepassing-refnote2-p03.webp" alt="Page from the notes on Persistence and synchronicity" width="1240" height="1755" loading="lazy" decoding="async">
<figcaption>Page from the notes on Persistence and synchronicity</figcaption>
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/messagepassing-refnote2-p02.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/messagepassing-refnote2-p02.webp" alt="Page from the notes on Persistence and synchronicity" width="1240" height="1755" loading="lazy" decoding="async">
<figcaption>Page from the notes on Persistence and synchronicity</figcaption>
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/messagepassing-refnote2-p06.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/messagepassing-refnote2-p06.webp" alt="Page from the notes on Persistence and synchronicity" width="1240" height="1755" loading="lazy" decoding="async">
<figcaption>Page from the notes on Persistence and synchronicity</figcaption>
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/messagepassing-refnote2-p14.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/messagepassing-refnote2-p14.webp" alt="Page from the notes on Persistence and synchronicity" width="1240" height="1755" loading="lazy" decoding="async">
<figcaption>Page from the notes on Persistence and synchronicity</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>Sockets</h3>

<p class="ref-meta">From <em>MessagePassing_refnote2.pdf</em>, <em>LectureMain_Ch_2_Communication_in_DS.pptx</em>, slides 4 and 44&ndash;48.</p>

<!-- dcc-fig:ch2/messagepassing-refnote2-p04.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/messagepassing-refnote2-p04.webp" alt="Page from the notes on Sockets" width="1240" height="1755" loading="lazy" decoding="async">
<figcaption>Page from the notes on Sockets</figcaption>
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/lecturemain-ch-2-communication-in-ds-s44-035.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/lecturemain-ch-2-communication-in-ds-s44-035.webp" alt="Sockets" width="902" height="557" loading="lazy" decoding="async">
<figcaption>Sockets</figcaption>
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/lecturemain-ch-2-communication-in-ds-s45-036.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/lecturemain-ch-2-communication-in-ds-s45-036.webp" alt="Illustration for Sockets" width="754" height="411" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/lecturemain-ch-2-communication-in-ds-s46-037.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/lecturemain-ch-2-communication-in-ds-s46-037.webp" alt="Illustration for Sockets" width="675" height="833" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/lecturemain-ch-2-communication-in-ds-s47-038.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/lecturemain-ch-2-communication-in-ds-s47-038.webp" alt="Illustration for Sockets" width="1409" height="794" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/lecturemain-ch-2-communication-in-ds-s48-039.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/lecturemain-ch-2-communication-in-ds-s48-039.webp" alt="Illustration for Sockets" width="631" height="559" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>Why web services exist</h3>

<p class="ref-meta">From <em>REST_SOAP_webservices_Lecture.pdf</em>, slides 1&ndash;6 and 10&ndash;12.</p>

<!-- dcc-fig:ch2/rest-soap-webservices-lecture-p01.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/rest-soap-webservices-lecture-p01.webp" alt="Illustration for Why web services exist" width="1241" height="1755" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/rest-soap-webservices-lecture-p02.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/rest-soap-webservices-lecture-p02.webp" alt="Illustration for Why web services exist" width="1241" height="1755" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/rest-soap-webservices-lecture-p04.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/rest-soap-webservices-lecture-p04.webp" alt="Illustration for Why web services exist" width="1241" height="1755" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/rest-soap-webservices-lecture-p03.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/rest-soap-webservices-lecture-p03.webp" alt="Illustration for Why web services exist" width="1241" height="1755" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/rest-soap-webservices-lecture-p05.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/rest-soap-webservices-lecture-p05.webp" alt="Illustration for Why web services exist" width="1241" height="1755" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/rest-soap-webservices-lecture-p12.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/rest-soap-webservices-lecture-p12.webp" alt="Illustration for Why web services exist" width="1241" height="1755" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/rest-soap-webservices-lecture-p06.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/rest-soap-webservices-lecture-p06.webp" alt="Illustration for Why web services exist" width="1241" height="1755" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/rest-soap-webservices-lecture-p10.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/rest-soap-webservices-lecture-p10.webp" alt="Illustration for Why web services exist" width="1241" height="1755" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/rest-soap-webservices-lecture-p11.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/rest-soap-webservices-lecture-p11.webp" alt="Illustration for Why web services exist" width="1241" height="1755" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>The two generations and their stacks</h3>

<p class="ref-meta">From <em>REST_SOAP_webservices_Lecture.pdf</em>, slides 7 and 14.</p>

<!-- dcc-fig:ch2/rest-soap-webservices-lecture-p07.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/rest-soap-webservices-lecture-p07.webp" alt="Illustration for The two generations and their stacks" width="1241" height="1755" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/rest-soap-webservices-lecture-p14.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/rest-soap-webservices-lecture-p14.webp" alt="Illustration for The two generations and their stacks" width="1241" height="1755" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>SOAP versus REST</h3>

<p class="ref-meta">From <em>REST_SOAP_webservices_Lecture.pdf</em>, slides 9, 13 and 15.</p>

<!-- dcc-fig:ch2/rest-soap-webservices-lecture-p09.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/rest-soap-webservices-lecture-p09.webp" alt="Illustration for SOAP versus REST — the comparison to reproduce" width="1241" height="1755" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/rest-soap-webservices-lecture-p13.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/rest-soap-webservices-lecture-p13.webp" alt="Illustration for SOAP versus REST — the comparison to reproduce" width="1241" height="1755" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch2/rest-soap-webservices-lecture-p15.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch2/rest-soap-webservices-lecture-p15.webp" alt="Illustration for SOAP versus REST — the comparison to reproduce" width="1241" height="1755" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->
`,
  quiz: [
    {
      q: 'In step 2 of a remote procedure call, packing the arguments into a network message is called:',
      options: [
        'Unmarshalling',
        'Marshalling',
        'Serialization of the caller',
        'Binding'
      ],
      answer: 1,
      explanation: 'Marshalling is the outbound packing of parameters (and the name or number of the procedure) into a message; unmarshalling is the inbound unpacking, done by the server stub at step 5 and by the client stub on the result at step 10. Serialization is the general problem; marshalling is serialization for the purpose of a call.'
    },
    {
      q: 'A client sends an RPC request, the server executes the procedure, and the reply is lost. Why is simply retransmitting the request a poor default fix?',
      options: [
        'Because the client cannot retransmit without knowing the procedure name',
        'Because the client OS discards duplicate replies',
        'Because the procedure may then execute twice, while the client only needed the result it already produced',
        'Because the server will have crashed on the first request'
      ],
      answer: 2,
      explanation: 'This is the at-least-once hazard: retransmitting masks the omission failure but can cause the operation to run more than once, storing or returning wrong values (arbitrary failure). The reliable request-reply measures answer it directly — duplicate filtering at the server, and keeping a history of result messages so the lost reply can be re-sent without re-executing.'
    },
    {
      q: 'Which pair of systems uses at-most-once invocation semantics?',
      options: [
        'SUNRPC and MPI',
        'Java RMI and CORBA',
        'CORBA and SUNRPC',
        'Java RMI and SUNRPC'
      ],
      answer: 1,
      explanation: 'Java RMI and CORBA use at-most-once. CORBA also uses maybe semantics for methods that return no result, and SUNRPC provides at-least-once. Remember it as a set — this is a favourite short question.'
    },
    {
      q: 'In RMI, which component marshals arguments on the client side and unmarshals the results?',
      options: [
        'The skeleton',
        'The dispatcher',
        'The proxy',
        'The remote reference module'
      ],
      answer: 2,
      explanation: 'The proxy provides remote invocation transparency: it marshals arguments, forwards the request, receives the message and unmarshals results. The skeleton does the reverse on the server — unmarshals arguments, invokes the method, marshals the results — and the dispatcher only selects and passes on the correct method.'
    },
    {
      q: 'What is the responsibility of the remote reference module in RMI?',
      options: [
        'Translating between local and remote object references, and keeping the remote object table',
        'Sending and receiving messages over the network',
        'Selecting the correct method for an arriving request',
        'Registering textual names so clients can look objects up'
      ],
      answer: 0,
      explanation: 'It translates between local and remote object references and maintains the remote object table, with an entry for each remote object the process holds and each local proxy; it creates a remote object reference when one arrives, and looks up or creates one when a reference must be passed. Registering names is the binder, and selecting the method is the dispatcher.'
    },
    {
      q: 'A Java RMI client cannot create a remote object by calling its constructor directly. What does it use instead?',
      options: [
        'A static initialiser on the remote interface',
        'Factory methods',
        'The skeleton constructor',
        'The dispatcher'
      ],
      answer: 1,
      explanation: 'It is stated as a rule about the client program: it cannot create remote objects by directly calling constructors, so factory methods are provided. This also explains why the server has an initialisation section that creates the remote objects and registers them with the binder.'
    },
    {
      q: 'Which statement about message passing is correct?',
      options: [
        'Processes share one data area and coordinate through locks',
        'Each process has its own data unit and there is no shared data; coordination is by send/recv',
        'Data is shared through the network interface card',
        'Messages are always delivered in the order sent, with no buffering'
      ],
      answer: 1,
      explanation: 'The work unit is processes, the data is decomposed so each process owns its own unit, there is no shared data, and coordination is by exchanging messages through send and receive calls — the mail analogy. Buffering, tag matching and packetization are exactly the costs that message passing incurs.'
    },
    {
      q: 'In MPI, which pair of calls brackets every other call?',
      options: [
        'MPI_Send and MPI_Recv',
        'MPI_Comm_size and MPI_Comm_rank',
        'MPI_Init and MPI_Finalize',
        'MPI_Init and MPI_Barrier'
      ],
      answer: 2,
      explanation: 'MPI_Init initialises the library and MPI_Finalize terminates its use; all MPI calls must occur between them, temporally. Comm_size and Comm_rank are how the program learns the number of processes and its own identifier.'
    },
    {
      q: 'A message-passing implementation sends the header first and does not send the data until the destination replies that it is ready. Which protocol is this?',
      options: [
        'Eager',
        'Short',
        'Rendezvous',
        'Broadcast'
      ],
      answer: 2,
      explanation: 'Rendezvous waits for an ok-to-send reply before the message is sent, so no large receive buffer is needed and the receiver cannot be overrun — at the cost of a round trip. Short is when the message fits internal buffers; eager sends immediately without waiting for the receiver.'
    },
    {
      q: 'Under persistent communication, a message is:',
      options: [
        'Discarded as soon as it cannot be delivered at the next server or receiver',
        'Stored at a communication server for as long as it takes to deliver it to the receiver',
        'Delivered only if the sender and receiver are active at the same time',
        'Stored on the sender until the sender is ready to resend'
      ],
      answer: 1,
      explanation: 'Persistent communication stores the message at the communication server until delivery is possible, however long that takes — the Pony Express analogy, and the basis of e-mail. Transient communication is the opposite: the message is discarded as soon as it cannot be delivered at the next server or the receiver.'
    },
    {
      q: 'Which is a stated drawback of synchronous communication in client/server computing?',
      options: [
        'The server cannot process more than one request in total',
        'The client cannot do any other work while waiting for a reply',
        'Messages cannot be stored in buffers',
        'The client does not know the server address'
      ],
      answer: 1,
      explanation: 'Three drawbacks are given: the client cannot do other work while waiting, failures must be dealt with immediately because the client is blocked, and in many cases the model is simply not appropriate — mail and news being the examples. Persistent, asynchronous, queued messaging is the alternative.'
    },
    {
      q: 'In the SOAP web service stack, which layer describes the API?',
      options: [
        'XML',
        'SOAP',
        'WSDL',
        'HTTP'
      ],
      answer: 2,
      explanation: 'The stack is WSDL (API description) over SOAP (messaging) over XML (data) over HTTP (transport). The REST stack is the same shape with WADL — completely optional and rarely used — over REST over JSON/XML over HTTP.'
    },
    {
      q: 'Why do web services use HTTP as their transport?',
      options: [
        'Because HTTP is the fastest available transport protocol',
        'Because it is a standard web protocol that browsers, servers and most languages support, so it passes through firewalls',
        'Because it encrypts the payload by default',
        'Because it provides the WSDL description'
      ],
      answer: 1,
      explanation: 'The problem being solved is that a direct connection to the database is not possible over the Internet because of firewalls and security. HTTP is supported by every browser and server and by libraries in every modern programming language, so it is the transport a firewall will allow through — not the fastest possible transport.'
    },
    {
      q: 'Which is a difference between REST and SOAP web services?',
      options: [
        'REST uses WSDL as a required description, SOAP uses WADL',
        'SOAP uses the HTTP headers to carry meta information, REST envelopes the message',
        'REST uses standard HTTP methods such as GET, PUT, POST and DELETE, and is usually used with JSON',
        'SOAP can only be consumed by browser-based clients'
      ],
      answer: 2,
      explanation: 'REST uses the standard HTTP methods as the operations and is usually used with JSON because it parses easily; it is faster than SOAP and works in a browser. SOAP envelopes the message over XML with a required WSDL description, is very mature but more complicated, and is not suitable for browser-based clients.'
    },
    {
      q: 'In the RPC advantages list, why is "based on call-by-value and call-by-reference parameters only" a disadvantage?',
      options: [
        'Because call-by-value is slower than call-by-name',
        'Because a value can be copied into a message but a reference is meaningful only in one address space',
        'Because the stub cannot marshal more than one parameter',
        'Because call-by-reference does not exist in Java'
      ],
      answer: 1,
      explanation: 'This is the serialization boundary. A value can be marshalled into a message and reconstructed at the other end; a reference is a pointer into one address space and means nothing in another, which is why passing objects remotely needs remote object references and the machinery of 2.2.'
    }
  ],

  past: [
    {
      year: 'Model 2025',
      marks: '4',
      repeats: 2,
      q: 'Describe Remote Procedure Call (RPC) with its working mechanism.',
      occ: [
        { year: 'Model 2025', marks: '4', q: 'Describe Remote Procedure Call (RPC) with its working mechanism.' },
        { year: 'Final 2025', marks: '2', q: 'Define RPC (Remote Procedure Call) and RMI (Remote Method Invocation).' }
      ],
      answer: `
<h4>Model answer &mdash; 4 marks</h4>
<p><strong>Definition.</strong> A Remote Procedure Call is an interaction between a client and a server in which <strong>the client invokes a procedure that resides remotely on a server</strong>. The server executes the procedure and passes the result back to the client; while the call is in progress, the calling of the procedure is <strong>blocked</strong> and is resumed only after the result arrives. RPC is based on the <strong>single-process procedure call model</strong> and so is a high-level network communication interface. A server process exposes a <strong>service interface</strong> defining the procedures available for remote calling, and works under a <strong>request&ndash;reply protocol</strong> that omits the object reference from request messages.</p>

<p><strong>Working mechanism.</strong> The call passes through a stub on each side, which is what makes a remote call look like a local one:</p>
<ol>
<li>The client procedure calls the <strong>client stub</strong> in the normal way.</li>
<li>The client stub builds a message containing the parameters and the name or number of the procedure, and calls the local operating system. This packaging is called <strong>marshalling</strong>.</li>
<li>The client sends the message to the remote OS via a system call to the local kernel, using a connectionless or connection-oriented protocol.</li>
<li>The remote OS gives the message to the <strong>server stub</strong>.</li>
<li>The server stub <strong>unmarshals</strong> the parameters and calls the server.</li>
<li>The server does the work and returns the result to the stub.</li>
<li>The server stub packs the result in a message and calls its local OS.</li>
<li>The server's OS sends the message to the client's OS.</li>
<li>The client's OS gives the message to the client stub.</li>
<li>The client stub unpacks the result and returns it to the waiting client procedure.</li>
</ol>

<p><strong>Faults and semantics (add this if there is room).</strong> Five faults are possible: the client cannot locate the server, the request message is lost, the reply message is lost, the server crashes after receiving a request, or the client crashes after sending one. <strong>Call semantics</strong> define when and how often the procedure may be executed &mdash; exactly once (hard in practice, needing time-outs, retransmissions, the same call identifier and a callee cache), at most once or maybe, at least once, last once, and last-of-many. A reliable request&ndash;reply protocol uses three measures: retrying the request, filtering duplicates at the server, and <strong>keeping a history of results</strong> so a lost reply can be re-sent without re-executing the operation.</p>

<div class="concept-box tip">
<h4>Where this came from</h4>
<p>Group B, question 7 of the <em>Model Question 2025</em>, worth 4 marks (Group A is <code>2*4 = 8</code>, Group C is three questions of 8 marks, and <code>8 + 7(4) + 3(8) = 60</code>). The question asks for the <em>working mechanism</em>, so the ten steps are the answer and everything else is context. Draw Fig 2.1 if you have time &mdash; a labelled diagram of client/stub/kernel and server/stub/kernel usually marks faster than prose.</p>
</div>`
    }
  ]
};
