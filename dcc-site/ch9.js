/* Chapter 9 — Emerging Trends in Distributed and Cloud Computing.

   Syllabus unit 9: 4 hours, 4 marks. Sub-topics 9.1 Edge and Fog Computing,
   9.2 Serverless Architecture, 9.3 Kubernetes and Docker, 9.4 Cloud-native and
   Microservices.

   Sourcing note, as for Unit 7: there is no Chapter 9 deck among the shared
   lecture files. What this page is built from:

     * the Chapter 6 deck's container material — the definition of
       containerization, the container engine (Docker Engine), the
       containers-versus-VMs architecture, the pros and cons lists including the
       Meltdown caveat, and the "virtualize the layers above the host OS" idea
       that 9.3 and 9.4 both depend on
     * `books_all_distributed_systems_tanenbaun_p0001-0200.txt` — Tanenbaum and
       Van Steen, a recommended reference, which contains the corpus's only
       discussion of the edge: edge-server systems taken a step further, with
       "additional servers at the edge of the network used to assist in
       computations and storage, essentially leading to distributed cloud
       systems", and then fog computing, where "even end-user devices form part
       of the system and are (partly) controlled by a cloud service provider"
     * the Chapter 7 material on Lambda, managed Kubernetes services (GKE, EKS,
       AKS) and regions, which is where these trends appear as products
     * the syllabus wording itself, and the Model Question 2025's Group C
       question 15, which is answered in Cloud-native architecture: the definition and the tools

   Where a fact is standard industry vocabulary rather than course material it
   is presented as the term's definition rather than as the teacher's wording,
   so the sourcing stays visible. */

window.CHAPTERS = window.CHAPTERS || {};
window.CHAPTERS[9] = {
  learn: `

<h2>Unit 9 &mdash; Emerging Trends in Distributed and Cloud Computing</h2>
<p class="unit-meta">Syllabus: 4 hours &middot; 4 marks &middot; sub-topics 9.1&ndash;9.4</p>

<h2>9.1 Edge and Fog Computing</h2>

<h3>Why computation moved out of the data centre again</h3>
<p>Cloud computing consolidated resources: pooled, virtualized and rented from large data centres because information and data processing can be done more efficiently on large farms of computing and storage systems. The counter-movement is driven by physics. When data is produced by devices &mdash; sensors, phones, cameras, vehicles, machines &mdash; sending all of it to a distant data centre and waiting for an answer costs <strong>latency</strong> (the round trip), <strong>bandwidth</strong> (the volume). Sometimes it also costs privacy or legal compliance (the data leaving a jurisdiction). It also fails entirely when the device is <strong>offline</strong>.</p>

<p>The progression, in full: content at the edge first &mdash; servers placed to replicate web pages, which is the content-delivery network and the oldest form of edge computing. Then the data centre becomes the core and servers at the edge of the network assist in computation and storage, which is what makes a distributed cloud system. In fog computing the edge extends all the way out: even end-user devices form part of the system, and are partly controlled by the cloud service provider.</p>

<h3>The three tiers</h3>
<figure class="figure-wide figure-wrap">
<svg class="figure wide" viewBox="0 0 800 360" role="img" aria-label="Three-tier architecture: devices at the edge, fog nodes near the edge, and the cloud data centre at the centre; processing moves toward the data source as latency, bandwidth and privacy pressure increases">
<defs><marker id="f9a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="flow-arrow-head"/></marker></defs>

<text class="flow-label" x="400" y="24" text-anchor="middle">Data is produced at the far left; capacity and scale increase to the right</text>

<rect class="flow-box phase1" x="30" y="60" width="180" height="110" rx="10"/>
<text class="flow-label" x="120" y="82" text-anchor="middle">Edge &mdash; the devices</text>
<text class="flow-label" x="120" y="104" text-anchor="middle">sensors, phones, cameras,</text>
<text class="flow-label" x="120" y="122" text-anchor="middle">vehicles, machines</text>
<text class="flow-label" x="120" y="148" text-anchor="middle">milliseconds &middot; tiny compute</text>

<rect class="flow-box phase2" x="250" y="60" width="220" height="110" rx="10"/>
<text class="flow-label" x="360" y="82" text-anchor="middle">Fog &mdash; nodes near the edge</text>
<text class="flow-label" x="360" y="104" text-anchor="middle">gateways, cell towers, on-premise</text>
<text class="flow-label" x="360" y="122" text-anchor="middle">servers, branch equipment</text>
<text class="flow-label" x="360" y="140" text-anchor="middle">local network latency,</text>
<text class="flow-label" x="360" y="158" text-anchor="middle">shared by many devices</text>

<rect class="flow-box phase3" x="510" y="60" width="260" height="110" rx="10"/>
<text class="flow-label" x="640" y="82" text-anchor="middle">Cloud &mdash; the data centre</text>
<text class="flow-label" x="640" y="104" text-anchor="middle">the elastic pool from Units 5&ndash;7</text>
<text class="flow-label" x="640" y="122" text-anchor="middle">unlimited capacity, global reach</text>
<text class="flow-label" x="640" y="140" text-anchor="middle">tens to hundreds of milliseconds</text>
<text class="flow-label" x="640" y="158" text-anchor="middle">training, archives, heavy analytics</text>

<path class="flow-arrow" d="M214,115 H246" marker-end="url(#f9a)"/>
<path class="flow-arrow" d="M474,115 H506" marker-end="url(#f9a)"/>
<text class="flow-label" x="230" y="100" text-anchor="middle">pre-aggregated data</text>
<text class="flow-label" x="490" y="100" text-anchor="middle">summaries, models</text>

<path class="flow-arrow" d="M506,168 H246" marker-end="url(#f9a)"/>
<path class="flow-arrow" d="M246,186 H214" marker-end="url(#f9a)"/>
<text class="flow-label" x="376" y="196" text-anchor="middle">model updates and commands</text>
<text class="flow-label" x="376" y="220" text-anchor="middle">the loop that makes the tiers one system rather than three</text>

<text class="flow-label" x="400" y="262" text-anchor="middle">Compute is placed where the latency and bandwidth allow it, and only what must be central is central.</text>
<text class="flow-label" x="400" y="286" text-anchor="middle">Tanenbaum's framing is the useful one: taking the data centre as the core, edge servers assist in computation and</text>
<text class="flow-label" x="400" y="306" text-anchor="middle">storage, leading to distributed cloud systems &mdash; and in fog computing even end-user devices are part of the</text>
<text class="flow-label" x="400" y="326" text-anchor="middle">system and partly controlled by the provider.</text>
</svg>
<figcaption>Fig 9.1 &mdash; Edge, fog and cloud as one system. The tiers are distinguished by where the compute sits relative to the data source, not by what technology they use: an edge node is a device doing something to its own data, a fog node is a shared machine one network hop away, and the cloud is the elastic pool of Units 5&ndash;7. The same control plane spans all three, which is the hard part.</figcaption>
</figure>

<table class="comparison-table">
<thead>
<tr><th></th><th>Cloud</th><th>Fog</th><th>Edge</th></tr>
</thead>
<tbody>
<tr><td><strong>Where the compute is</strong></td><td>Large, centralised data centres.</td><td>Nodes between the devices and the cloud &mdash; gateways, base stations, on-premise servers.</td><td>In the devices themselves.</td></tr>
<tr><td>Node count and capacity per node</td><td>Few nodes, very large.</td><td>Many nodes, medium.</td><td>Very many nodes, very small.</td></tr>
<tr><td><strong>Latency to the data</strong></td><td>Tens to hundreds of milliseconds; depends on distance and routing.</td><td>Low &mdash; one local network hop, shared among many devices.</td><td>Effectively zero &mdash; the computation is on the device.</td></tr>
<tr><td><strong>Bandwidth sent upward</strong></td><td>Receives raw data if nothing filters it.</td><td>Receives pre-aggregated data from devices.</td><td>Filters, summarises and decides first.</td></tr>
<tr><td><strong>Suited to</strong></td><td>Heavy analytics, model training, archives, long-term storage, global services.</td><td>Coordination between devices, local analytics, caching, filtering, small models.</td><td>Real-time control, safety, offline operation, privacy-sensitive data.</td></tr>
<tr><td><strong>Typical example</strong></td><td>The elastic pool of Units 5&ndash;7.</td><td>A gateway aggregating a factory's sensors; a cell tower hosting content and a small model.</td><td>A car braking on its own sensors; a camera detecting a person without sending video anywhere.</td></tr>
</tbody>
</table>

<h3>What the trends actually buy</h3>
<ul>
<li><strong>Latency</strong> &mdash; a control loop cannot wait for a round trip to another continent. This is the requirement that makes tactile control, autonomous driving and industrial automation impossible in a purely centralised model.</li>
<li>Bandwidth and cost &mdash; a camera producing megabytes per second cannot send all of it. Filtering at the edge is the difference between sending events and sending video.</li>
<li>Privacy and compliance &mdash; processing where the data was produced is the simplest way to keep personal or regulated data inside a jurisdiction, which is the data residency problem solved by not moving the data.</li>
<li><strong>Availability</strong> &mdash; a device that keeps working without connectivity is a device that keeps working. Centralised designs fail when the network does.</li>
</ul>
<p>And the costs: many more nodes to manage (a fleet of devices is not one data centre), <strong>weaker physical security</strong> (a device in the field can be stolen or opened), and <strong>updates across a fleet</strong>. The problems already met once also return: clock synchronisation and coordination, now between thousands of devices with intermittent connectivity.</p>

<div class="concept-box tip">
<h4>Why edge computing is a distributed-systems topic</h4>
<p>Moving the compute out of the data centre does not simplify the system: it re-creates every problem in this syllabus with less reliable hardware. The devices have <strong>their own clocks</strong>, they must communicate only by passing messages, they experience partial failure, and the data they hold is replicated and therefore needs a consistency rule. Edge computing is the same discipline applied under harder constraints.</p>
</div>

<h2>9.2 Serverless Architecture</h2>

<h3>What serverless means</h3>
<div class="concept-box key">
<p>Serverless computing is a model in which the provider runs the code and the customer does not provision, size, patch or pay for servers at all. The name describes the customer's view, not the reality &mdash; there are servers; there are simply none the customer has to think about. It has two halves:</p>
<ul>
<li>FaaS &mdash; Functions as a Service: event-driven code execution, billed per invocation and per unit of execution time. The serverless platforms are AWS Lambda, Azure Functions and Google Cloud Functions.</li>
<li>BaaS &mdash; Backend as a Service: the managed services a function calls instead of running its own &mdash; managed databases, queues, authentication, object storage, notifications. DBaaS is the same idea for data.</li>
</ul>
</div>

<p>The defining properties follow from the billing model, and each one is a trade:</p>
<table class="comparison-table">
<thead>
<tr><th>Property</th><th>What it means</th><th>What it costs</th></tr>
</thead>
<tbody>
<tr><td><strong>Event-driven</strong></td><td>An event starts the code &mdash; an HTTP request, a file arriving in object storage, a queue message, a scheduled tick &mdash; and the function ends when it returns.</td><td>Not suited to long-running or continuous work (stream processing with high throughput, for example), because the platform charges per invocation and caps execution time.</td></tr>
<tr><td><strong>No server management</strong></td><td>No operating system to choose, patch, scale or secure.</td><td>Almost no control over the runtime, its version, its libraries or its network behaviour, which confuses debugging and rules out workloads needing a specific kernel.</td></tr>
<tr><td>Automatic, fine-grained scaling</td><td>Scaling is per request; each invocation is independent, so traffic is met by concurrent copies rather than by a machine getting bigger.</td><td>Concurrency limits and the cold start problem: after a period of idleness, the first request must wait for the runtime to be initialised.</td></tr>
<tr><td><strong>Pay per use</strong></td><td>Billed per invocation and per execution time, so nothing running means nothing billed &mdash; the purest form of the pay-per-usage provisioning tension, since the provider absorbs the sizing decision.</td><td>The trade for a steady, high load is poor: an always-busy function is more expensive than a reserved virtual machine doing the same work.</td></tr>
<tr><td><strong>Stateless functions</strong></td><td>State does not persist between invocations, so any data that must outlive a request goes to storage, a database or a queue.</td><td>Requires the application to be written for it, and pushes most of the design into the BaaS services around the function.</td></tr>
</tbody>
</table>

<p>Serverless is the last step of a progression: physical servers you own &rarr; virtual machines you manage (EC2) &rarr; containers you package &rarr; functions you only write. Each step moves one more layer of operations to the provider; each step trades control for convenience. The same trade applies at every step, so any two of them can be compared on the same reasoning.</p>

<h3>Where serverless is the right answer</h3>
<ul>
<li><strong>Glue between services</strong> &mdash; a file arriving in storage triggers a resize or an index update; a database change triggers a notification.</li>
<li>Scheduled and administrative jobs &mdash; nightly reports, cleanup, backups: work that runs for minutes a day and would otherwise pay for 24 hours of idle machine.</li>
<li>Sporadic and unpredictable traffic &mdash; an internal tool, a webhook endpoint, an API used in bursts &mdash; where capacity sized for the peak would sit idle most of the time.</li>
<li>Backend for an event-driven application &mdash; where each step of a workflow is a function consuming the previous step's event.</li>
</ul>
<p>And where it is the wrong answer: <strong>long-running processes</strong>, <strong>stateful services</strong>, latency-critical workloads where a cold start is unacceptable, and <strong>steady high load</strong>, where a reserved instance is cheaper.</p>

<h2>9.3 Kubernetes and Docker</h2>

<h3>Docker and the container it runs</h3>
<div class="example-box">
<h4>Example: Docker &amp; Containers</h4>
<p>A <strong>container</strong> packages code, dependencies and configuration into a single image. Using the <strong>Docker Engine</strong>, containers create isolated OS environments within the same host kernel — sharing it across containers running different functions. Only binaries and runtime components run separately per container, making them more resource-efficient than VMs.</p>
<p><strong>Docker</strong> is the containerisation engine &mdash; the tool that builds the image, runs it as a container, and moves it between machines. Its terms, all of them from that definition:</p>
<table class="comparison-table">
<thead>
<tr><th>Term</th><th>Meaning</th><th>Where it comes from in the course</th></tr>
</thead>
<tbody>
<tr><td><strong>Image</strong></td><td>The packaged unit: the application's code, its dependencies and its configuration, frozen.</td><td>The "single image" and its Encapsulation benefit &mdash; a complete computing environment as one artefact.</td></tr>
<tr><td><strong>Container</strong></td><td>A running instance of an image: an isolated OS environment within the same host system kernel.</td><td>The container definition from Unit 6.</td></tr>
<tr><td><strong>Dockerfile</strong></td><td>The recipe that builds the image, so the environment is reproducible rather than documented.</td><td>The <strong>portability</strong> benefit: "size, ease of defining a container, versioning".</td></tr>
<tr><td><strong>Registry</strong></td><td>Where images are stored and fetched from, so a build on one machine becomes a deployment on another.</td><td>The <strong>great ecosystem</strong> benefit.</td></tr>
<tr><td><strong>Container engine</strong></td><td>What runs the container &mdash; Docker Engine. Containers can run on top of bare-metal servers, on top of hypervisors, or in cloud infrastructure.</td><td>Stated in Unit 6.</td></tr>
</tbody>
</table>

<p>Those terms describe what Docker does. The kernel mechanisms underneath are three, and
all three are Linux features rather than Docker inventions &mdash; the engine's job is to
compose them into something that looks like a machine.</p>
<ul>
<li><strong>Namespaces</strong> &mdash; isolate what a process can see: its own process
IDs, network interfaces, routes, mount points and hostname, so the processes inside it
cannot see the host's or another container's.</li>
<li><strong>Control groups (cgroups)</strong> &mdash; limit what a process can use: CPU
time, memory, block I/O and process count, which is what gives a container a budget
instead of letting it starve its neighbours.</li>
<li><strong>A layered filesystem</strong> &mdash; an image is a stack of read-only layers
with one writable layer on top, so images share their common layers and a container
starts without copying a whole filesystem.</li>
</ul>
<p>Together they explain the numbers: a container is measured in megabytes and seconds
where a virtual machine is measured in gigabytes and minutes, because nothing is
duplicated and nothing is emulated.</p>
</div>

<figure class="figure-wide figure-wrap">
<svg class="figure wide" viewBox="0 0 800 430" role="img" aria-label="Docker's three building blocks under a container: an image is the packaged unit and a container is one running instance of it, isolated by namespaces, limited by control groups and started from a layered filesystem, all of them features of the shared Linux kernel">
<defs><marker id="f9c" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="flow-arrow-head"/></marker></defs>

<text class="flow-label" x="400" y="22" text-anchor="middle">Docker Engine &mdash; builds the image, runs it as a container, and moves it between machines</text>

<rect class="flow-box phase1" x="60" y="40" width="300" height="64" rx="10"/>
<text class="flow-text" x="210" y="66">Image</text>
<text class="flow-label" x="210" y="88" text-anchor="middle">code, dependencies and configuration, frozen</text>

<path class="flow-arrow" d="M364,72 H434" marker-end="url(#f9c)"/>
<text class="flow-label" x="400" y="60" text-anchor="middle">docker run</text>

<rect class="flow-box phase2" x="440" y="40" width="300" height="64" rx="10"/>
<text class="flow-text" x="590" y="66">Container</text>
<text class="flow-label" x="590" y="88" text-anchor="middle">one running instance of that image</text>

<text class="flow-label" x="400" y="132" text-anchor="middle">a container is an isolated OS environment inside the same host kernel, so nothing is duplicated</text>

<rect class="flow-box phase3" x="40" y="150" width="720" height="54" rx="10"/>
<text class="flow-text" x="400" y="174">Namespaces &mdash; what a process can see</text>
<text class="flow-label" x="400" y="194" text-anchor="middle">process IDs, network interfaces, routes, mount points and hostname: each container sees only its own</text>

<rect class="flow-box phase4" x="40" y="212" width="720" height="54" rx="10"/>
<text class="flow-text" x="400" y="236">Control groups &mdash; what a process may use</text>
<text class="flow-label" x="400" y="256" text-anchor="middle">CPU time, memory, block I/O and process count: a budget, so one container cannot starve another</text>

<rect class="flow-box phase1" x="40" y="274" width="720" height="54" rx="10"/>
<text class="flow-text" x="400" y="298">A layered filesystem &mdash; what a process starts from</text>
<text class="flow-label" x="400" y="318" text-anchor="middle">read-only image layers shared between containers, with one writable layer on top</text>

<rect class="flow-box phase2" x="40" y="336" width="720" height="48" rx="10"/>
<text class="flow-text" x="400" y="365">Host kernel &mdash; one Linux kernel, shared by every container</text>

<text class="flow-label" x="400" y="406" text-anchor="middle">All three are Linux features rather than Docker inventions: the engine's job is to compose them into a machine.</text>
</svg>
<figcaption>Fig 9.2 &mdash; Docker's three building blocks, and the line between an image and a container. An image is the packaged unit; a container is one running instance of it, and the image it runs from is a stack of layers every other container on the host also uses. The isolation is not Docker's invention: namespaces decide what a process can <em>see</em>, control groups decide what it may <em>use</em>, and the layered filesystem decides what it <em>starts from</em> &mdash; all three features of the one shared kernel, composed by the engine into something that looks like a machine.</figcaption>
</figure>

<h3>Why an orchestrator is needed</h3>
<div class="example-box">
<h4>Example: Kubernetes</h4>
<p>One container on one machine needs Docker. A production system is dozens or hundreds of containers across many machines, and at that scale four problems appear that Docker does not solve:</p>
<ol>
<li><strong>Placement</strong> &mdash; which container should run on which node, given the resource requests, the constraints and the current load.</li>
<li>Restarts and self-healing &mdash; if a container crashes, or the node it is on fails, something must start it again elsewhere.</li>
<li><strong>Scaling</strong> &mdash; adding copies when load rises and removing them when it falls, exactly the elasticity expressed as container replicas.</li>
<li>Networking and discovery &mdash; when containers are created and destroyed constantly, their addresses are not stable, so callers need a name that resolves to whatever is currently healthy.</li>
</ol>
<p>Kubernetes is the orchestrator that solves them, and its central idea is this: you declare the desired state and the orchestrator continuously works to make the actual state match it. That is the same shape as this course's other control mechanisms &mdash; the demand-driven provisioning compares a measured value against a threshold and corrects; Kubernetes compares the observed state of the whole cluster against a declared spec and corrects.</p>

<table class="comparison-table">
<thead>
<tr><th>Concept</th><th>What it is</th></tr>
</thead>
<tbody>
<tr><td><strong>Pod</strong></td><td>The smallest deployable unit &mdash; one or more containers that share a network namespace and storage, scheduled together.</td></tr>
<tr><td><strong>Node</strong></td><td>A machine (physical or virtual) that runs pods. The virtual machines are the nodes here.</td></tr>
<tr><td><strong>Control plane</strong></td><td>The components that watch the cluster and reconcile it with the declared specification: the API where state is declared, the scheduler that places pods, and the controllers that act on differences.</td></tr>
<tr><td><strong>Deployment (declared state)</strong></td><td>The specification of how many replicas of an image should be running. Change the number and the orchestrator creates or removes pods; change the image and it performs a rolling update that replaces pods gradually instead of stopping the service.</td></tr>
<tr><td><strong>Service</strong></td><td>A stable name and virtual address in front of a changing set of pods &mdash; which also provides load balancing, the infrastructure-layer function from Unit 7.</td></tr>
<tr><td><strong>Self-healing</strong></td><td>The controller notices a pod that died or a node that failed and schedules replacements, so the declared replica count is restored without an operator.</td></tr>
<tr><td><strong>Managed Kubernetes</strong></td><td>The provider runs the control plane: GKE on Google Cloud, EKS on AWS, AKS on Azure. This is PaaS for orchestration.</td></tr>
</tbody>
</table>

<p>The components split into two halves: one watches the cluster and the other runs the containers.</p>
<table class="comparison-table">
<thead>
<tr><th>Half</th><th>Component</th><th>What it does</th></tr>
</thead>
<tbody>
<tr><td><strong>Control plane</strong></td><td><strong>API server</strong></td><td>The cluster's front door: every declaration and every query passes through it, and it is the only component that talks to the store below.</td></tr>
<tr><td><strong>Control plane</strong></td><td><strong>etcd</strong></td><td>The cluster's store of record &mdash; the declared state, kept consistently and watched for changes.</td></tr>
<tr><td><strong>Control plane</strong></td><td><strong>Scheduler</strong></td><td>Assigns each new pod to a node, using the resource requests and the constraints in the specification.</td></tr>
<tr><td><strong>Control plane</strong></td><td><strong>Controller manager</strong></td><td>Runs the reconciliation loops &mdash; replica count, node health, endpoints &mdash; and acts on every difference between the declared and the observed state.</td></tr>
<tr><td><strong>Node</strong></td><td><strong>kubelet</strong></td><td>The agent on every worker node: it starts and watches the containers it has been told to run, and reports their status back.</td></tr>
<tr><td><strong>Node</strong></td><td><strong>kube-proxy</strong></td><td>Implements the network rules that make a service's stable address reach whichever pods are currently behind it.</td></tr>
<tr><td><strong>Node</strong></td><td><strong>Container runtime</strong></td><td>What actually runs the container &mdash; Docker Engine or another runtime that implements the same contract.</td></tr>
</tbody>
</table>
<p>The division is the point: a failure in the worker half loses capacity, while a failure
in the control half loses the ability to make decisions. That is why a managed
service runs the control plane in the provider's care and leaves the nodes to the customer.</p>
</div>

<figure class="figure-wide figure-wrap">
<svg class="figure wide" viewBox="0 0 800 430" role="img" aria-label="Kubernetes in two halves: a control plane of API server, etcd, scheduler and controller manager that decides what should be running, and nodes whose kubelet, kube-proxy and container runtime run the pods the control plane asks for">
<defs><marker id="f9d" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="flow-arrow-head"/></marker></defs>

<text class="flow-label" x="400" y="22" text-anchor="middle">One cluster, two halves: what should be running, and what is running</text>

<text class="flow-text" x="210" y="52">Control plane &mdash; it decides</text>
<text class="flow-label" x="210" y="70" text-anchor="middle">reconciles the cluster with the declared state</text>

<text class="flow-text" x="590" y="52">Node &mdash; it runs the containers</text>
<text class="flow-label" x="590" y="70" text-anchor="middle">a machine that runs pods</text>

<rect class="flow-box phase3" x="40" y="86" width="340" height="54" rx="10"/>
<text class="flow-text" x="210" y="110">API server</text>
<text class="flow-label" x="210" y="130" text-anchor="middle">the front door for every declaration and query</text>

<rect class="flow-box phase3" x="40" y="146" width="340" height="54" rx="10"/>
<text class="flow-text" x="210" y="170">etcd</text>
<text class="flow-label" x="210" y="190" text-anchor="middle">the store of record: the declared state</text>

<rect class="flow-box phase3" x="40" y="206" width="340" height="54" rx="10"/>
<text class="flow-text" x="210" y="230">Scheduler</text>
<text class="flow-label" x="210" y="250" text-anchor="middle">assigns each new pod to a node</text>

<rect class="flow-box phase3" x="40" y="266" width="340" height="54" rx="10"/>
<text class="flow-text" x="210" y="290">Controller manager</text>
<text class="flow-label" x="210" y="310" text-anchor="middle">the reconciliation loops, watching for differences</text>

<rect class="flow-box phase1" x="420" y="86" width="340" height="54" rx="10"/>
<text class="flow-text" x="590" y="110">kubelet</text>
<text class="flow-label" x="590" y="130" text-anchor="middle">starts and watches the containers it is told to run</text>

<rect class="flow-box phase1" x="420" y="146" width="340" height="54" rx="10"/>
<text class="flow-text" x="590" y="170">kube-proxy</text>
<text class="flow-label" x="590" y="190" text-anchor="middle">the network rules behind a service's stable address</text>

<rect class="flow-box phase1" x="420" y="206" width="340" height="54" rx="10"/>
<text class="flow-text" x="590" y="230">Container runtime</text>
<text class="flow-label" x="590" y="250" text-anchor="middle">Docker Engine, or another runtime on the same contract</text>

<rect class="flow-box phase1" x="420" y="266" width="340" height="54" rx="10"/>
<text class="flow-text" x="590" y="290">Pods</text>
<text class="flow-label" x="590" y="310" text-anchor="middle">one or more containers sharing a network namespace</text>

<path class="flow-arrow" d="M384,150 H416" marker-end="url(#f9d)"/>
<path class="flow-arrow" d="M416,232 H384" marker-end="url(#f9d)"/>

<text class="flow-label" x="400" y="350" text-anchor="middle">The API server holds what should exist; the kubelet reports what does.</text>
<text class="flow-label" x="400" y="372" text-anchor="middle">A managed service keeps the control plane in the provider's care and leaves the nodes to the customer.</text>
<text class="flow-label" x="400" y="394" text-anchor="middle">Lose the worker half and you lose capacity; lose the control half and you lose decisions.</text>
</svg>
<figcaption>Fig 9.3 &mdash; Kubernetes in its two halves. The control plane is the half that decides: every declaration passes through the API server, the state it declares lives in etcd, the scheduler places new pods on nodes, and the controller manager runs the loops that close the gap between what is declared and what is observed. The node is the half that runs the work: a kubelet starts and watches the containers it is told to run, a kube-proxy makes a service's stable address reach whichever pods are behind it, and the container runtime is Docker Engine or another implementation of the same contract.</figcaption>
</figure>

<div class="concept-box tip">
<h4>Docker and Kubernetes in one sentence each</h4>
<p>Docker packages an application and its dependencies into an image and runs it as an isolated container on a shared kernel; Kubernetes decides where those containers run, keeps the declared number of them alive, scales them with load, and gives them stable names. Docker answers "how does this run the same way everywhere?"; Kubernetes answers "how does it keep running, at the right size, when machines fail?"</p>
</div>

<h3>The security caveat</h3>
<p>Containers are not free isolation, and the course says so explicitly: the cons list includes less security due to sharing of the underlying operating system (Meltdown is the example), all containers must run atop the same kernel, and less flexibility with respect to hardware requirements. The trade is this: virtualization puts a hypervisor between tenants and gives hardware-level isolation, while containers put a shared kernel between them and give speed and density instead &mdash; which is why the multi-tenant risks are sharper for containers. It is also why "shared technology risks" is a named vulnerability rather than a hypothetical one.</p>

<p>The mechanism explains why the risk is structural and not a bug in any one product. A virtual machine's boundary is enforced by the hypervisor, so crossing it needs a flaw in the hypervisor itself. A container's boundary is enforced by the kernel the container shares with its neighbours, so crossing it needs <em>any</em> flaw in that kernel &mdash; which is exactly what Meltdown was, a processor-and-kernel-level flaw that let one process read memory belonging to another. Add one default that makes it worse: the first process in a container normally runs as root inside its own environment, so what a successful escape yields is not a foothold but root on the host, and with it every other container on that machine. Docker reduces that default with user namespaces, but it is a mitigation rather than a guarantee, and the last con follows from the same sharing: containers cannot supply a <em>different</em> kernel or set of drivers from the host's. A workload needing another operating system or special hardware needs a virtual machine after all.</p>

<div class="concept-box tip">
<h4>Hardening a container</h4>
<p>The flaw is stated above, and the standard hardening practice is the response. Run the container as a non-root user, drop the capabilities it does not need, mount its filesystem read-only, apply a seccomp or AppArmor profile to restrict which system calls it may make, scan images for known-vulnerable packages and keep the host kernel patched. For genuinely untrusted workloads, put them in a sandboxed runtime or a virtual machine. One sentence carries cloud-native architecture: <em>containers trade isolation for density, so on a shared host the container boundary must be hardened, and a shared-technology risk of this kind is mitigated rather than removed.</em></p>
</div>

<h2>9.4 Cloud-native and Microservices</h2>

<h3>What cloud-native means</h3>
<div class="concept-box key">
<p>Cloud-native is a way of designing and running applications that takes the cloud's properties as given rather than treating the cloud as a place to host something built for a server. A cloud-native application assumes the platform is elastic, programmable, failure-prone and disposable &mdash; so it is built from small independently deployable services, packaged as containers, run on an orchestrator that can move and replace them, delivered continuously, and observed through logs, metrics and traces. The distinction that matters: <em>lift-and-shift</em> moves an existing application to the cloud unchanged and inherits the cloud's costs without its benefits; <em>cloud-native</em> changes the application's design so that elasticity, self-healing and pay-per-use are actually usable.</p>
</div>

<p>The defining characteristics, each of which is a property of this course rather than of a product:</p>
<table class="comparison-table">
<thead>
<tr><th>Characteristic</th><th>Why the cloud makes it possible</th></tr>
</thead>
<tbody>
<tr><td><strong>Microservices</strong></td><td>Small services with clear boundaries can be deployed and scaled independently &mdash; which only pays off when compute is elastic and cheap to start.</td></tr>
<tr><td><strong>Containers</strong></td><td>The image makes an application's environment reproducible and portable, which is what lets the same artefact run on a laptop, a test cluster and production.</td></tr>
<tr><td><strong>Orchestration</strong></td><td>Scheduling, self-healing and scaling are the platform's job rather than the operator's.</td></tr>
<tr><td><strong>Declarative configuration</strong></td><td>State is declared and reconciled rather than scripted, so the system can be rebuilt from its description &mdash; which is what makes automated recovery possible.</td></tr>
<tr><td><strong>Immutable infrastructure</strong></td><td>Instead of patching a running server, you replace it with a new image. This is the hypervisor's encapsulation benefit taken to its conclusion, and it removes configuration drift &mdash; and with it the misconfiguration vulnerability.</td></tr>
<tr><td><strong>Continuous delivery</strong></td><td>Small services and reproducible images allow many small deployments instead of rare large ones.</td></tr>
<tr><td><strong>Observability</strong></td><td>A system of many small services fails in many small ways, so logs, metrics and traces are how you find out why &mdash; the same requirement as centralised logging and SIEM.</td></tr>
<tr><td><strong>Horizontal scaling</strong></td><td>Load is handled by adding instances, not by enlarging one &mdash; the elasticity and the "add or remove computing instances" of the three provisioning methods.</td></tr>
</tbody>
</table>

<h3>Microservices, and the monolith they replace</h3>
<p>A microservice architecture structures an application as a set of small, independently deployable services. Each owns its own data and communicates over a network interface &mdash; which means each communicating only by passing messages, over web service interfaces, with each service's remote interface defined like any other remote object.</p>

<table class="comparison-table">
<thead>
<tr><th></th><th>Monolith</th><th>Microservices</th></tr>
</thead>
<tbody>
<tr><td><strong>Structure</strong></td><td>One deployable unit containing all the functionality.</td><td>Many small services, each independently deployable.</td></tr>
<tr><td><strong>Scaling</strong></td><td>Scale the whole application, even if one part is the bottleneck.</td><td>Scale only the service under load &mdash; elasticity applied where it is needed.</td></tr>
<tr><td><strong>Deployment</strong></td><td>One change means redeploying everything, so releases become rare and large.</td><td>Independent deployments, so releases become frequent and small.</td></tr>
<tr><td><strong>Technology</strong></td><td>One language, one framework, one runtime for the whole system.</td><td>Each service can use the best tool for its job, which is heterogeneity used deliberately.</td></tr>
<tr><td><strong>Failure</strong></td><td>A fault in one module can take down the whole application.</td><td>A fault is contained in one service &mdash; but partial failure becomes the normal condition, not the exception.</td></tr>
<tr><td><strong>Data</strong></td><td>One database, transactions across all the data.</td><td>Each service owns its data, so consistency across services becomes the problem of consistency across services, solved with events and eventual consistency rather than distributed transactions.</td></tr>
<tr><td><strong>Operations</strong></td><td>One thing to monitor and one log to read.</td><td>Many services to monitor &mdash; observability, tracing and service discovery become mandatory, which is exactly the complexity that containers and orchestration absorb.</td></tr>
<tr><td><strong>Best for</strong></td><td>A small team, a young product, or an application whose scale is modest.</td><td>A system with independent parts that need to scale and change at different rates, run by several teams.</td></tr>
</tbody>
</table>

<div class="concept-box warn">
<h4>The costs are distributed-systems costs, not fashion</h4>
<p>Splitting an application into services converts local calls into remote calls, <strong>request latency</strong>, <strong>marshalling</strong>, <strong>call semantics</strong> and the five RPC faults &mdash; and the six ways a distributed object differs from a local one apply to every internal call. A monolith's function call cannot lose its reply message; a microservice's call can. That is the reason a microservice architecture needs orchestration, retries, timeouts, tracing and idempotent operations; it is also the answer to "what are the disadvantages of microservices".</p>
</div>

<h3>How containers and orchestration support the architecture</h3>
<p>The support runs in four steps. Microservices create the need for packaging. Once the application is cut into many small services rather than built as one deployable unit, each service has to arrive at its destination with its own dependencies intact, because there is no longer one environment that everything shares. Packaging creates the need for orchestration. An image is a static artefact; something has to decide which machine runs it, how many copies exist, what happens when one dies and how traffic finds the survivors. That is a scheduling problem, not a packaging one, which is why Docker alone leaves a fleet of machines to look after. Many moving services create the need for delivery and observability. When releases are frequent and small, deployment has to be routine rather than an event; and when failures are partial, they cannot be found by looking at one machine &mdash; logs, metrics and traces have to follow a request across services.</p>

<p>Each step has a cost. Microservices convert local calls into remote calls, so request latency, marshalling and partial failure arrive with them. Containers <strong>share the host kernel</strong>, so isolation is weaker than a hypervisor's and the shared-technology risk is sharper. Orchestration adds an operational layer that is itself a distributed system &mdash; a scheduler, a control plane and a store of declared state, all of which can fail and all of which must be learned. <em>The architecture is chosen for how it changes and scales, and the tools are what make that choice survivable at scale.</em></p>

<figure class="figure-wide figure-wrap">
<svg class="figure wide" viewBox="0 0 800 340" role="img" aria-label="A cloud-native stack: microservices on top, packaged as container images, scheduled and healed by an orchestrator across nodes, delivered by a pipeline, and observed through logs metrics and traces">
<defs><marker id="f9b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="flow-arrow-head"/></marker></defs>

<rect class="flow-box phase1" x="180" y="34" width="440" height="52" rx="10"/>
<text class="flow-text" x="400" y="58">Microservices</text>
<text class="flow-label" x="400" y="78" text-anchor="middle">small independently deployable services, each owning its data</text>

<rect class="flow-box phase2" x="180" y="100" width="440" height="52" rx="10"/>
<text class="flow-text" x="400" y="124">Container images (Docker)</text>
<text class="flow-label" x="400" y="144" text-anchor="middle">packaged with its dependencies, the same artefact everywhere</text>

<rect class="flow-box phase3" x="180" y="166" width="440" height="52" rx="10"/>
<text class="flow-text" x="400" y="190">Orchestrator (Kubernetes)</text>
<text class="flow-label" x="400" y="210" text-anchor="middle">placement, replicas, self-healing, scaling, stable names</text>

<rect class="flow-box phase4" x="180" y="232" width="440" height="46" rx="10"/>
<text class="flow-text" x="400" y="260">Nodes &mdash; virtual machines or bare metal</text>

<rect class="flow-box phase1" x="20" y="100" width="130" height="118" rx="10"/>
<text class="flow-label" x="85" y="130" text-anchor="middle">Delivery</text>
<text class="flow-label" x="85" y="152" text-anchor="middle">build &rarr; test &rarr;</text>
<text class="flow-label" x="85" y="172" text-anchor="middle">deploy, often,</text>
<text class="flow-label" x="85" y="192" text-anchor="middle">small changes</text>
<path class="flow-arrow" d="M154,160 H176" marker-end="url(#f9b)"/>

<rect class="flow-box phase3" x="650" y="100" width="130" height="118" rx="10"/>
<text class="flow-label" x="715" y="130" text-anchor="middle">Observability</text>
<text class="flow-label" x="715" y="152" text-anchor="middle">logs, metrics,</text>
<text class="flow-label" x="715" y="172" text-anchor="middle">traces &mdash;</text>
<text class="flow-label" x="715" y="192" text-anchor="middle">how many small</text>
<text class="flow-label" x="715" y="210" text-anchor="middle">failures are found</text>
<path class="flow-arrow" d="M624,160 H646" marker-end="url(#f9b)"/>

<text class="flow-label" x="400" y="306" text-anchor="middle">Each layer removes one operational burden, which is what makes many small services practical at all.</text>
<text class="flow-label" x="400" y="328" text-anchor="middle">Remove the orchestrator and the architecture becomes a fleet of machines to babysit.</text>
</svg>
<figcaption>Fig 9.4 &mdash; The cloud-native stack. An argument rather than a stack diagram: microservices <em>need</em> reproducible packaging, packaging <em>needs</em> an orchestrator to be useful at scale, and a system of many moving services <em>needs</em> continuous delivery and observability to be operable.</figcaption>
</figure>

<h3>The trend list, in the syllabus's own terms</h3>
<table class="comparison-table">
<thead>
<tr><th>Trend</th><th>The one-line definition</th></tr>
</thead>
<tbody>
<tr><td>Edge and fog computing</td><td>Moving computation and storage toward the data source &mdash; fog nodes one hop from the devices, and in fog computing even end-user devices forming part of a provider-controlled system (the standard formulation) &mdash; to cut latency and bandwidth and to keep data local.</td></tr>
<tr><td><strong>Serverless architecture</strong></td><td>Functions and managed backends that the customer does not provision or size, invoked by events and billed per invocation, with the platform scaling per request.</td></tr>
<tr><td>Kubernetes and Docker</td><td>Docker packages an application with its dependencies into an image and runs it as an isolated container on a shared kernel; Kubernetes schedules, heals and scales those containers across a cluster from a declared specification.</td></tr>
<tr><td>Cloud-native and microservices</td><td>Designing the application for the cloud's properties &mdash; small independently deployable services, containers, orchestration, declarative configuration, immutable infrastructure, continuous delivery and observability.</td></tr>
</tbody>
</table>

<p>Each trend moves computation in a <em>direction</em> and answers something specific: toward the data for edge and fog (latency and bandwidth), away from provisioning for serverless (idle capacity and operations), and toward smaller deployable units for cloud-native (release speed and independent scaling).</p>

<p>One distinction is easy to blur: edge and fog computing move computation, while the other three move nothing. Serverless, containers and microservices are all changes to <em>how an application is built and run</em> inside a data centre; edge and fog change <em>where the data centre effectively is</em>.</p>

<h3>How the trends connect to each other</h3>
<p>The trends are <strong>one arc</strong>: consolidation into the cloud, the problems that creates, and then distribution back out toward the data (edge and fog) while the application itself is decomposed so that it can be placed and scaled in pieces (microservices, containers, orchestration, serverless). Nothing in the course stops being true at the edge: clocks still drift, messages still get lost, replicas still disagree and failures are still partial &mdash; the constraints merely get tighter, which is why the same syllabus is what a cloud-native engineer uses every day.</p>

<p>Each trend is an earlier unit carried to a new place. Edge and fog ask the deployment and service models a harder question: if latency and bandwidth are the cost, what if the cloud came to the data instead of the data to the cloud? <strong>Serverless</strong> completes the compute ladder: EC2 manages the OS, containers manage the runtime, and functions manage even the process lifetime, which is the provisioning question with the provider doing the provisioning. Containers and Kubernetes continue the virtualisation discussion past the hypervisor, and their scheduling problem is resource management at cluster scale. Cloud-native and microservices use the fundamental challenges: heterogeneity becomes "each service, its own tool", concurrency and partial failure become the normal condition, and communication problems become every internal call.</p>

<p>All four move a problem rather than deleting it: edge computing moves computation but must still synchronise the results back, serverless moves provisioning but not the cold-start latency or the cost of a badly chosen partition. Microservices move complexity out of the code and into the operational platform.</p>

<h3>Cloud-native architecture: the definition and the tools</h3>
<ol>
<li>What it is. The definition, then the characteristics in its table &mdash; microservices, containers, orchestration, declarative configuration, immutable infrastructure, continuous delivery, observability, horizontal scaling &mdash; and the contrast with lift-and-shift.</li>
<li>How each tool supports it.
<ul>
<li><strong>Microservices</strong> provide the <em>structure</em>: small independently deployable services, each owning its data, so parts can be scaled and changed without the whole.</li>
<li><strong>Containers</strong> provide the <em>packaging</em>: an image with code, dependencies and configuration makes each service's environment reproducible and portable, so the same artefact runs anywhere and configuration drift disappears.</li>
<li><strong>Orchestration</strong> provides the <em>operation</em>: Kubernetes schedules containers onto nodes, keeps the declared replica count alive, replaces what fails, adds and removes copies as load changes, gives services stable names, and performs rolling updates. That is what makes running many small services practical rather than a fleet of machines to babysit.</li>
</ul></li>
</ol>

<p class="past-pointer">Questions on this unit, with model answers, are on the <a href="#/ch/9/past">Past Questions</a> tab.</p>
`,

  revise: {"why-computation-moved-out-of-the-data-centre-again":"<p>Cloud computing consolidated resources; the counter-movement is driven by physics.</p>\r\n<ul>\r\n<li>Sending all device data to a distant data centre costs <strong>latency</strong>, <strong>bandwidth</strong> and sometimes <strong>privacy</strong> or legal compliance, and fails entirely when the device is <strong>offline</strong>.</li>\r\n<li>The progression: content at the edge (the content-delivery network), then edge servers assisting, then <strong>fog computing</strong>, where end-user devices form part of the system.</li>\r\n</ul>","the-three-tiers":"<p>Compute is placed where latency and bandwidth allow it, and only what must be central is central.</p>\r\n<ul>\r\n<li><strong>Edge</strong> \u2014 the devices themselves: milliseconds, tiny compute, real-time control and offline operation.</li>\r\n<li><strong>Fog</strong> \u2014 nodes near the edge: gateways, cell towers, on-premise servers, one local network hop, shared by many devices.</li>\r\n<li><strong>Cloud</strong> \u2014 the data centre: the elastic pool, unlimited capacity and global reach, for training, archives and heavy analytics.</li>\r\n</ul>\r\n<p>The tiers differ by where the compute sits relative to the data source, not by what technology they use.</p>","what-the-trends-actually-buy":"<p>What the move to the edge buys, and what it costs.</p>\r\n<ul>\r\n<li><strong>Latency</strong> \u2014 a control loop cannot wait for a round trip to another continent.</li>\r\n<li><strong>Bandwidth and cost</strong> \u2014 filtering at the edge is the difference between sending events and sending video.</li>\r\n<li><strong>Privacy and compliance</strong> \u2014 processing where the data was produced keeps regulated data inside a jurisdiction.</li>\r\n<li><strong>Availability</strong> \u2014 a device that keeps working without connectivity keeps working.</li>\r\n<li>The costs: many more nodes to manage, weaker physical security, updates across a fleet, and clock synchronisation between thousands of devices.</li>\r\n</ul>","what-serverless-means":"<p><strong>Serverless</strong> computing is a model in which the provider runs the code and the customer provisions no servers.</p>\r\n<ul>\r\n<li><strong>FaaS</strong> \u2014 event-driven execution billed per invocation; the platforms are AWS Lambda, Azure Functions and Google Cloud Functions.</li>\r\n<li><strong>BaaS</strong> \u2014 managed databases, queues, authentication and storage that a function calls instead of running its own.</li>\r\n<li>The properties: event-driven, no server management, automatic scaling, pay per use, and <strong>stateless</strong> functions.</li>\r\n<li>The trade: control is given up for convenience, and steady high load is cheaper on a reserved machine.</li>\r\n</ul>","where-serverless-is-the-right-answer":"<p>Where serverless fits, and where it does not.</p>\r\n<ul>\r\n<li><strong>Glue between services</strong> \u2014 a file arriving in storage triggers a resize or an index update.</li>\r\n<li><strong>Scheduled and administrative jobs</strong> \u2014 nightly reports, cleanup, backups: minutes of work a day.</li>\r\n<li><strong>Sporadic</strong> traffic \u2014 an internal tool, a webhook endpoint, or an API used in bursts.</li>\r\n<li>An <strong>event-driven application</strong> \u2014 each step of a workflow consumes the previous step's event.</li>\r\n<li>Wrong for long-running processes, stateful services, latency-critical workloads where a cold start is unacceptable, and steady high load.</li>\r\n</ul>","docker-and-the-container-it-runs":"<p>A <strong>container</strong> is a unit of software that is lightweight but still bundles the code, its dependencies and the configuration into a single image.</p>\r\n<ul>\r\n<li>Unlike a virtual machine it shares the <strong>host system kernel</strong>, and is therefore more resource-efficient.</li>\r\n<li><strong>Image</strong> \u2014 the packaged unit, frozen; <strong>Dockerfile</strong> \u2014 the recipe that builds it, so the environment is reproducible.</li>\r\n<li><strong>Registry</strong> \u2014 where images are stored and fetched, so a build becomes a deployment.</li>\r\n<li><strong>Container engine</strong> \u2014 what runs the container \u2014 on bare metal, on hypervisors or in cloud infrastructure.</li>\r\n</ul>","why-an-orchestrator-is-needed":"<p>A production system is many containers across many machines, and Docker does not solve four problems.</p>\r\n<ul>\r\n<li><strong>Placement</strong> \u2014 which container runs on which node; <strong>restarts and self-healing</strong> \u2014 replacing what crashes.</li>\r\n<li><strong>Scaling</strong> \u2014 adding copies when load rises; <strong>networking and discovery</strong> \u2014 callers need a stable name.</li>\r\n<li><strong>Kubernetes</strong> solves them by declaring the desired state and continuously working to match it.</li>\r\n<li>A <strong>pod</strong> is the smallest deployable unit, a <strong>service</strong> a stable name in front of a changing set of pods, and <strong>managed Kubernetes</strong> the provider running the control plane.</li>\r\n</ul>","the-security-caveat":"<p>Containers are not free isolation: the cons include less security from sharing the operating system.</p>\r\n<ul>\r\n<li>A virtual machine's boundary is enforced by the <strong>hypervisor</strong>; a container's by the <strong>kernel</strong> it shares with its neighbours, so any kernel flaw crosses it \u2014 <strong>Meltdown</strong> was one.</li>\r\n<li>The first process normally runs as <strong>root</strong>, so an escape yields root on the host.</li>\r\n<li><strong>Hardening</strong>: run as a non-root user, drop unneeded capabilities, mount read-only, apply a seccomp or AppArmor profile, and patch the host kernel.</li>\r\n</ul>","what-cloud-native-means":"<p><strong>Cloud-native</strong> treats the cloud's properties as given rather than as a place to host something built for a server.</p>\r\n<ul>\r\n<li>The application assumes the platform is elastic, programmable, failure-prone and disposable, so it is built from small independently deployable services.</li>\r\n<li><strong>Lift-and-shift</strong> inherits the cloud's costs without its benefits; cloud-native changes the design so elasticity, self-healing and pay-per-use are usable.</li>\r\n<li>The characteristics: <strong>microservices</strong>, <strong>containers</strong>, <strong>orchestration</strong>, <strong>declarative configuration</strong>, <strong>immutable infrastructure</strong>, <strong>continuous delivery</strong>, <strong>observability</strong> and <strong>horizontal scaling</strong>.</li>\r\n</ul>","microservices-and-the-monolith-they-replace":"<p>A <strong>microservice architecture</strong> structures an application as small independently deployable services, each owning its data and communicating over a network interface.</p>\r\n<ul>\r\n<li>Versus a <strong>monolith</strong>: scaling is per service rather than the whole application; deployment is independent; each service can use its own technology; a fault is contained.</li>\r\n<li>The cost: each service owns its data, so consistency across services replaces distributed transactions, and partial failure becomes normal.</li>\r\n<li>The real cost is distributed systems \u2014 splitting an application converts local calls into remote calls, bringing latency, marshalling and call semantics.</li>\r\n</ul>","how-containers-and-orchestration-support-the-architecture":"<p>The support is an argument in four steps rather than a stack.</p>\r\n<ul>\r\n<li><strong>Microservices</strong> create the need for packaging: each service must arrive with its dependencies intact.</li>\r\n<li><strong>Packaging</strong> creates the need for orchestration: an image is static, so something must place it and keep the copies alive.</li>\r\n<li>Many moving services create the need for <strong>delivery and observability</strong>, because failures are partial and not visible on one machine.</li>\r\n<li>Each step costs: remote calls, a weaker boundary than a hypervisor's, and an orchestration layer that is itself a distributed system.</li>\r\n</ul>","the-trend-list-in-the-syllabus-s-own-terms":"<p>Four trends, one line each.</p>\r\n<ul>\r\n<li><strong>Edge and fog computing</strong> \u2014 moving computation toward the data source, to cut latency and bandwidth.</li>\r\n<li><strong>Serverless architecture</strong> \u2014 functions and managed backends the customer does not provision, billed per invocation.</li>\r\n<li><strong>Kubernetes and Docker</strong> \u2014 Docker packages an application into an image; Kubernetes schedules, heals and scales those containers.</li>\r\n<li><strong>Cloud-native and microservices</strong> \u2014 designing for the cloud's properties: small services, containers, orchestration.</li>\r\n<li>The distinction: edge and fog move computation; the other three change how an application is built.</li>\r\n</ul>","how-the-trends-connect-to-each-other":"<p>The trends are one arc: consolidation into the cloud, the problems it creates, then distribution back out.</p>\r\n<ul>\r\n<li><strong>Edge and fog</strong> ask the deployment question harder: what if the cloud came to the data?</li>\r\n<li><strong>Serverless</strong> completes the compute ladder \u2014 EC2 the OS, containers the runtime, functions the process lifetime.</li>\r\n<li><strong>Containers and Kubernetes</strong> continue the virtualisation discussion past the hypervisor, at cluster scale.</li>\r\n<li><strong>Cloud-native and microservices</strong> use the fundamental challenges: heterogeneity, concurrency and partial failure become normal.</li>\r\n<li>Every trend moves a problem rather than deleting it.</li>\r\n</ul>","cloud-native-architecture-the-definition-and-the-tools":"<p>The topic has two halves: what cloud-native architecture is, and how each tool supports it.</p>\r\n<ul>\r\n<li><strong>What it is</strong> \u2014 the definition, the characteristics (microservices, containers, orchestration, declarative configuration, immutable infrastructure, continuous delivery, observability, horizontal scaling), and the contrast with lift-and-shift.</li>\r\n<li><strong>How each tool supports it</strong> \u2014 microservices provide the structure, containers the packaging, and orchestration the operation that keeps the declared replica count alive and replaces what fails.</li>\r\n</ul>"},
  pastSummary: `<h2>Exam-facing summary</h2>
<table class="comparison-table">
<thead>
<tr><th>If the question says&hellip;</th><th>Give&hellip;</th></tr>
</thead>
<tbody>
<tr><td>Explain edge and fog computing</td><td>The motivation (latency, bandwidth, privacy, offline operation); the three tiers of Fig 9.1 with Tanenbaum's progression from edge-server content replication to distributed cloud systems to fog computing where even end-user devices are part of the system; the cloud-versus-fog-versus-edge table; what it buys; and the costs &mdash; many nodes, weaker physical security, fleet updates, and the return of Unit 3's clock and coordination problems.</td></tr>
<tr><td>What is serverless architecture?</td><td>The definition (the provider runs the code and the customer does not provision, size, patch or pay for servers), its two halves (FaaS and BaaS), and the five properties with their trades &mdash; event-driven, no server management, automatic fine-grained scaling with cold starts, pay per use, and stateless functions &mdash; plus where it is the wrong choice.</td></tr>
<tr><td>Explain Docker and Kubernetes</td><td>Docker: the container definition from Unit 6 (image bundling code, dependencies and configuration; isolated OS environments on a shared kernel; more efficient than VMs), and its vocabulary &mdash; image, container, Dockerfile, registry, engine. Kubernetes: why an orchestrator is needed (placement, self-healing, scaling, networking and discovery), what it is (declared state continuously reconciled), and its concepts &mdash; pod, node, control plane, deployment with rolling updates, service with load balancing, self-healing, and managed Kubernetes as GKE/EKS/AKS.</td></tr>
<tr><td>Discuss cloud-native architecture (4 marks)</td><td>The definition and the characteristics table: microservices, containers, orchestration, declarative configuration, immutable infrastructure, continuous delivery, observability and horizontal scaling &mdash; with the lift-and-shift contrast.</td></tr>
<tr><td>How do microservices, containers and Kubernetes support it? (4 marks)</td><td>Structure (microservices), packaging (containers) and operation (Kubernetes) &mdash; one paragraph each, with the cost of each: the distributed-systems costs for microservices, the shared-kernel security caveat for containers, and the operational layer Kubernetes puts between the developer and the machines.</td></tr>
<tr><td>Compare a monolith with microservices</td><td>The table &mdash; structure, scaling, deployment, technology, failure, data, operations and fit.</td></tr>
</tbody>
</table>


`,

  quiz: [
    {
      q: 'What is the main motivation for edge and fog computing?',
      options: [
        'Reducing the cost of data centre hardware',
        'Moving computation toward the data source to reduce latency and bandwidth, keep data local and allow offline operation',
        'Replacing cloud computing entirely',
        'Eliminating the need for replication'
      ],
      answer: 1,
      explanation: 'Sending all device data to a distant data centre costs latency (the round trip), bandwidth (the volume) and sometimes privacy or compliance (the data leaving a jurisdiction), and it fails when the device is offline. Units 5–8 were about consolidation; this is the counter-movement, with reasons that are physical.'
    },
    {
      q: 'In Tanenbaum\'s progression, what distinguishes fog computing from edge-server systems?',
      options: [
        'Fog nodes are in data centres',
        'In fog computing even end-user devices form part of the system and are (partly) controlled by a cloud service provider',
        'Fog computing uses no network',
        'Fog computing is another name for content delivery networks'
      ],
      answer: 1,
      explanation: 'The progression described: edge servers first replicated web pages; then, taking the data centre as the core, additional servers at the edge assist in computation and storage, leading to distributed cloud systems; and in fog computing even end-user devices form part of the system and are partly controlled by the provider.'
    },
    {
      q: 'Which tier has the highest latency to the data it processes?',
      options: [
        'The edge (the devices)',
        'The fog nodes',
        'The cloud data centre',
        'All three are equal'
      ],
      answer: 2,
      explanation: 'The tiers are distinguished by where the compute sits relative to the data source: edge compute is on the device (effectively no latency), fog is one local network hop away shared among many devices, and the cloud is tens to hundreds of milliseconds away depending on distance and routing.'
    },
    {
      q: 'Why is edge computing described as re-creating the problems this course has already solved once?',
      options: [
        'Because devices are more expensive than servers',
        'Because the devices have their own clocks, communicate only by messages, experience partial failure, and hold replicated data needing a consistency rule',
        'Because the software must be written in a different language',
        'Because edge nodes cannot be secured'
      ],
      answer: 1,
      explanation: 'Unit 3\'s clock synchronisation and coordination, Unit 1\'s message-only communication, Unit 4\'s fault tolerance and consistency all return — with less reliable hardware and intermittent connectivity. The constraints get tighter; the principles do not change.'
    },
    {
      q: 'In serverless computing, what does the customer pay for?',
      options: [
        'The servers, by the hour',
        'Invocations and execution duration, so nothing running means nothing billed',
        'A flat monthly subscription',
        'Only the storage used'
      ],
      answer: 1,
      explanation: 'FaaS bills per invocation and per unit of execution time. That billing model is why the architecture is event-driven and stateless, and why it is a poor fit for steady high load — an always-busy function costs more than a reserved virtual machine doing the same work.'
    },
    {
      q: 'What is a cold start in serverless computing?',
      options: [
        'Restarting the provider\'s data centre',
        'The delay before the first request after a period of idleness, while the runtime is initialised',
        'The time taken to deploy a new function version',
        'A function that runs in a cold region'
      ],
      answer: 1,
      explanation: 'Because functions are started on demand, an idle function\'s next invocation must wait for the runtime to initialise. It is the cost of not keeping a process warm, and it makes serverless unsuitable for latency-critical workloads.'
    },
    {
      q: 'What does BaaS mean in the serverless context?',
      options: [
        'Billing as a Service',
        'Backend as a Service — the managed services a function calls instead of running its own',
        'Bandwidth as a Service',
        'Backup as a Service'
      ],
      answer: 1,
      explanation: 'Serverless has two halves: FaaS (functions invoked by events) and BaaS (managed databases, queues, authentication, object storage and notifications). It is the same idea as DBaaS in Unit 7.'
    },
    {
      q: 'How do containers differ from virtual machines architecturally?',
      options: [
        'Containers emulate hardware, VMs do not',
        'Containers create several isolated OS environments within the same host system kernel, so only binaries, libraries and runtime components are separate per container',
        'Containers include a full guest operating system each',
        'Containers require a hypervisor and VMs do not'
      ],
      answer: 1,
      explanation: 'A VM runs on a hypervisor which emulates hardware, so each instance carries its own guest OS; a container engine such as Docker creates isolated OS environments inside the same host kernel, which makes containers more resource-efficient. The trade is less isolation, since containers share the underlying OS.'
    },
    {
      q: 'What is the relationship between Docker and Kubernetes?',
      options: [
        'They are competing container engines',
        'Docker packages and runs containers on a machine; Kubernetes schedules, heals and scales them across a cluster',
        'Kubernetes builds container images and Docker orchestrates them',
        'Docker is the orchestrator and Kubernetes is the image registry'
      ],
      answer: 1,
      explanation: 'Docker answers "how does this run the same way everywhere?" by building an image and running it as a container; Kubernetes answers "how does it keep running, at the right size, when machines fail?" The syllabus pairs them in one sub-topic for that reason.'
    },
    {
      q: 'Which four problems does an orchestrator solve that a container engine alone does not?',
      options: [
        'Compilation, testing, packaging and publishing',
        'Placement, restarts and self-healing, scaling, and networking and discovery',
        'Encryption, authentication, authorisation and auditing',
        'Billing, metering, reporting and invoicing'
      ],
      answer: 1,
      explanation: 'At the scale of dozens or hundreds of containers across many machines: which node a container runs on, restarting it when it or its node fails, adding and removing copies with load, and giving callers a stable name because container addresses are not stable.'
    },
    {
      q: 'What is Kubernetes\'s central design idea?',
      options: [
        'You script every step of deployment in order',
        'You declare the desired state and the orchestrator continuously works to make the actual state match it',
        'Containers are pinned to specific machines forever',
        'Each container is given a fixed IP address'
      ],
      answer: 1,
      explanation: 'Declared state continuously reconciled — the same shape as the demand-driven provisioning of the three provisioning methods, which compares a measured value against a threshold and corrects. In Kubernetes the compared quantity is the observed state of the cluster against a specification.'
    },
    {
      q: 'In Kubernetes, what is a pod?',
      options: [
        'A physical server in the cluster',
        'The smallest deployable unit — one or more containers sharing a network namespace and storage, scheduled together',
        'A container image stored in a registry',
        'A load-balancing rule'
      ],
      answer: 1,
      explanation: 'A node is the machine that runs pods (the VMs of Units 6 and 7); a service is a stable name and address in front of a changing set of pods, which also load-balances; and a deployment is the declaration of how many replicas of an image should be running.'
    },
    {
      q: 'Which of these is a stated disadvantage of containers?',
      options: [
        'They cannot be versioned',
        'Less secure due to sharing the underlying operating system, with Meltdown as the example',
        'They cannot run in cloud infrastructure',
        'They require more resources than virtual machines'
      ],
      answer: 1,
      explanation: 'The three cons: all containers must run atop the same kernel, less security because the underlying OS is shared (Meltdown), and less flexibility with respect to hardware requirements. Virtualization gives hardware-level isolation; containers trade that for speed and density.'
    },
    {
      q: 'What is cloud-native architecture, as distinct from lift-and-shift?',
      options: [
        'An application that runs only in a public cloud',
        'An application designed for the cloud\'s properties — small independently deployable services in containers, orchestrated, declaratively configured, continuously delivered and observable',
        'An application rewritten in a cloud vendor\'s programming language',
        'An application that uses serverless functions exclusively'
      ],
      answer: 1,
      explanation: 'Lift-and-shift moves an existing application to the cloud unchanged and inherits the costs without the benefits; cloud-native changes the design so that elasticity, self-healing and pay-per-use are actually usable.'
    },
    {
      q: 'Which is a benefit of microservices over a monolith?',
      options: [
        'Fewer network calls',
        'Each service can be scaled and deployed independently, and a fault can be contained in one service',
        'A single database makes transactions easy',
        'Operations are simpler because there is only one log to read'
      ],
      answer: 1,
      explanation: 'Independent deployability and scaling, technology choice per service and fault containment are the benefits. The costs are that operations become harder (many services to monitor, hence observability) and data consistency across services becomes the DFS consistency problem from Unit 4.'
    },
    {
      q: 'Why does splitting an application into microservices introduce distributed-systems problems?',
      options: [
        'Because services must be written in different languages',
        'Because local calls become remote calls, so latency, marshalling, call semantics and the RPC failure modes all apply',
        'Because each service needs its own data centre',
        'Because containers cannot communicate'
      ],
      answer: 1,
      explanation: 'Every internal call becomes a call with request latency, marshalling, invocation semantics and the five RPC faults — and the six differences between a local and a distributed object from Unit 2.0 apply at every boundary. A monolith\'s function call cannot lose its reply message; a microservice\'s call can.'
    },
    {
      q: 'Immutable infrastructure means:',
      options: [
        'Servers are never rebooted',
        'Instead of patching a running server you replace it with a new image',
        'Data cannot be deleted',
        'Containers are never rebuilt'
      ],
      answer: 1,
      explanation: 'Replacement rather than mutation removes configuration drift, and it is the hypervisor\'s encapsulation benefit taken to its conclusion. It is also the direct answer to Unit 8\'s misconfiguration vulnerability, since an image is built once and deployed identically.'
    },
    {
      q: 'Which of these is NOT one of the four sub-topics of this unit?',
      options: [
        'Edge and fog computing',
        'Serverless architecture',
        'Kubernetes and Docker',
        'Content delivery networks'
      ],
      answer: 3,
      explanation: 'The syllabus lists 9.1 Edge and Fog Computing, 9.2 Serverless Architecture, 9.3 Kubernetes and Docker and 9.4 Cloud-native and Microservices. CDNs are related to the edge — Tanenbaum\'s progression starts from edge servers replicating web pages — but they are not a named sub-topic.'
    }
  ],

  past: [
    {
      year: '2025 (expected)',
      marks: '5',
      repeats: 1,
      q: 'What is Kubernetes? Explain its role in container orchestration.',
      occ: [
        { year: '2025 (expected)', marks: '5', q: 'What is Kubernetes? Explain its role in container orchestration.' }
      ],
      answer: `
<h4>Model answer &mdash; 5 marks</h4>
<p><strong>Kubernetes</strong> is an open-source container orchestration system: it manages a
fleet of containers across a cluster of machines, and it is the <em>orchestration</em> half of
Docker's <em>containerisation</em> half. Docker builds and runs one container; Kubernetes
decides where the containers run, keeps them running, and connects them.</p>
<p><strong>What its role means in practice</strong>, and each of these is a problem that appears
only once you have more than a few containers:</p>
<ul>
<li><strong>Scheduling</strong> &mdash; placing each container on a node with enough capacity,
respecting its resource requests.</li>
<li><strong>Self-healing and desired state</strong> &mdash; you declare how many replicas should
run and Kubernetes restarts or reschedules them when one dies or a node fails.</li>
<li><strong>Scaling</strong> &mdash; replicas increase or decrease with load, which is what makes
microservices' independent scaling real.</li>
<li><strong>Service discovery and load balancing</strong> &mdash; containers are ephemeral and
their addresses change, so a stable name in front of a changing set is essential.</li>
<li><strong>Rolling updates and rollback</strong> &mdash; a new version replaces the old gradually
and can be reverted, which is what makes frequent deployment safe.</li>
<li><strong>Declarative configuration</strong> &mdash; the whole desired state is a file, so the
cluster can be reproduced and reviewed like code.</li>
</ul>
<div class="concept-box tip">
<h4>Marking this one</h4>
<p>Predicted &mdash; from the previous site's “Expected / 2025 Exam” set, 5 marks. The
definition is one mark; the rest are for the roles, so name them as roles rather than listing
features. Kubernetes appears in the syllabus beside Docker and microservices, so the answer is
better when it says what it lets a microservices architecture <em>do</em>.</p>
</div>
`
    },
    {
      year: '2025 (expected)',
      marks: '5',
      repeats: 1,
      q: 'Explain Edge Computing and Fog Computing. How do they differ from Cloud Computing?',
      occ: [
        { year: '2025 (expected)', marks: '5', q: 'Explain Edge Computing and Fog Computing. How do they differ from Cloud Computing?' }
      ],
      answer: `
<h4>Model answer &mdash; 5 marks</h4>
<p>Both move computation closer to where the data is produced. The reason is the same in both
cases: sending everything to a distant data centre costs latency and bandwidth, and some
workloads &mdash; a factory, a vehicle, a sensor grid &mdash; cannot wait for a round trip.</p>
<ul>
<li><strong>Edge computing</strong> &mdash; processing happens at or beside the source: on the
device, the gateway or the local server. The extreme end of the spectrum, minimal latency, and
the smallest amount of resource.</li>
<li><strong>Fog computing</strong> &mdash; an intermediate layer between the edge and the cloud:
local nodes with more capacity than a device but less than a data centre, handling aggregation,
filtering and short-term decisions, while the cloud keeps the heavy analysis and long-term
storage. Fog is best described as the middle tier that makes the edge and the cloud cooperate.</li>
</ul>
<table class="comparison-table">
<tr><th></th><th>Cloud</th><th>Fog</th><th>Edge</th></tr>
<tr><td>Distance to data</td><td>Far</td><td>Near</td><td>At the source</td></tr>
<tr><td>Latency</td><td>Tens to hundreds of ms</td><td>Low</td><td>Lowest</td></tr>
<tr><td>Capacity</td><td>Effectively unlimited</td><td>Moderate</td><td>Limited</td></tr>
<tr><td>Centralisation</td><td>Centralised</td><td>Partially distributed</td><td>Highly distributed</td></tr>
</table>
<p>The unit's framing: the cloud is the top tier, the edge is the bottom, and fog is the tier
that connects them. All three process the same data at different points in its journey.</p>
<div class="concept-box tip">
<h4>Marking this one</h4>
<p>Predicted &mdash; from the previous site's “Expected / 2025 Exam” set, 5 marks. Two
definitions and the contrast; the tier framing (cloud top, fog middle, edge bottom) is the
sentence that shows the three are one architecture rather than three unrelated ideas.</p>
</div>
`
    },
    {
      year: '2025 (expected)',
      marks: '6',
      repeats: 1,
      q: 'Compare Monolithic and Microservices architectures.',
      occ: [
        { year: '2025 (expected)', marks: '6', q: 'Compare Monolithic and Microservices architectures.' }
      ],
      answer: `
<h4>Model answer &mdash; 6 marks</h4>
<p>A monolith is one deployable unit containing every concern; microservices are that unit
split into independently deployable services communicating over the network. Every other
difference follows from that one.</p>
<table class="comparison-table">
<tr><th>Aspect</th><th>Monolithic</th><th>Microservices</th></tr>
<tr><td>Deployment</td><td>One artefact; a change redeploys everything</td><td>One artefact per service; deploy independently</td></tr>
<tr><td>Scaling</td><td>Scale the whole application</td><td>Scale only the service under load</td></tr>
<tr><td>Technology</td><td>One stack for everything</td><td>Each service picks its own stack</td></tr>
<tr><td>Data</td><td>One shared database &mdash; transactions are easy</td><td>Database per service &mdash; transactions need sagas or eventual consistency</td></tr>
<tr><td>Failure</td><td>One fault can take the whole application down</td><td>Failure is contained, but network failure is now a normal case</td></tr>
<tr><td>Operational cost</td><td>Low &mdash; one thing to run</td><td>High &mdash; many services, so orchestration and observability are required</td></tr>
<tr><td>Team fit</td><td>One team, one codebase</td><td>Small autonomous teams owning services</td></tr>
</table>
<p>The balanced sentence the marks want: microservices buy independent deployability and
fault isolation, and pay for them with distributed-systems complexity &mdash; which is why
containers and orchestration (Docker, Kubernetes) are named in the same syllabus sub-topic.
Neither is simply better; a small team on a young product is usually better served by a
monolith.</p>
<div class="concept-box tip">
<h4>Marking this one</h4>
<p>Predicted &mdash; from the previous site's “Expected / 2025 Exam” set, 6 marks. A
comparison, so an answer that describes both without contrasting them loses the marks that are
for the comparison. The trade-off sentence is what stops it reading as advocacy.</p>
</div>
`
    },
    {
      year: '2025 (expected)',
      marks: '4',
      repeats: 1,
      q: 'Explain Serverless Computing and its advantages.',
      occ: [
        { year: '2025 (expected)', marks: '4', q: 'Explain Serverless Computing and its advantages.' }
      ],
      answer: `
<h4>Model answer &mdash; 4 marks</h4>
<p><strong>Serverless</strong> (function-as-a-service, FaaS) is the deployment model in which the
provider runs the code and the customer supplies only a function. There is still a server; what
disappears is the customer's responsibility for it. The unit defines it as the point where the
provider manages the servers and the runtime, the application is broken into functions, and the
customer <strong>pays only for the time the code actually executes</strong> &mdash; and not for
idle time, which is the property that distinguishes it from a rented VM.</p>
<p><strong>The advantages.</strong></p>
<ul>
<li><strong>No server management</strong> &mdash; no operating system to patch, no capacity to
plan. This is the operational saving the model is sold on.</li>
<li><strong>Elastic to zero</strong> &mdash; it scales out automatically with load and costs
nothing when there is no load. A traditional deployment pays for an idle machine.</li>
<li><strong>Pay per invocation, in milliseconds</strong> &mdash; a cost model with no floor,
which suits spiky and intermittent workloads.</li>
<li><strong>Faster to build</strong> &mdash; the unit pairs it with microservices: one function
per concern, deployed independently, so a change ships without redeploying a monolith.</li>
</ul>
<p>The trade-off worth one line: a function is short-lived and stateless, so state must live in
a managed service, and a cold start is a latency the customer does not control.</p>
<div class="concept-box tip">
<h4>Marking this one</h4>
<p>Predicted &mdash; from the previous site's “Expected / 2025 Exam” set, 4 marks. Four
marks: the definition, then advantages. The definition is not complete without the billing
model, because pay-for-execution is what makes it serverless rather than merely managed.</p>
</div>
`
    },
    {
      year: 'Model 2025',
      marks: '8',
      repeats: 1,
      q: 'Discuss cloud-native architecture. How do microservices, containers, and orchestration tools like Kubernetes support it? [4+4]',
      occ: [
        { year: 'Model 2025', marks: '8', q: 'Discuss cloud-native architecture. How do microservices, containers, and orchestration tools like Kubernetes support it? [4+4]' }
      ],
      answer: `
<h4>Model answer &mdash; 8 marks</h4>

<p><strong>Part 1 &mdash; Cloud-native architecture (4 marks).</strong></p>
<p><strong>Definition.</strong> Cloud-native is <strong>a way of designing and running applications that treats the cloud's properties as given rather than treating the cloud as a place to host something built for a server</strong>. A cloud-native application assumes the platform is <strong>elastic, programmable, failure-prone and disposable</strong>, and is therefore built from <strong>small independently deployable services, packaged as containers, run on an orchestrator that can move and replace them, delivered continuously, and observed through logs, metrics and traces</strong>. The contrast that defines it is with <strong>lift-and-shift</strong>: moving an existing application to the cloud unchanged inherits the cloud's costs without its benefits, whereas cloud-native changes the design so that elasticity, self-healing and pay-per-use are actually usable.</p>

<p><strong>Characteristics.</strong></p>
<ul>
<li><strong>Microservices</strong> &mdash; small services with clear boundaries that can be deployed and scaled independently, which only pays off when compute is elastic and cheap to start.</li>
<li><strong>Containers</strong> &mdash; the image makes an application's environment <strong>reproducible and portable</strong>, so the same artefact runs on a laptop, a test cluster and in production.</li>
<li><strong>Orchestration</strong> &mdash; scheduling, self-healing and scaling become the platform's job rather than the operator's.</li>
<li><strong>Declarative configuration</strong> &mdash; state is declared and reconciled rather than scripted, which is what makes automated recovery possible.</li>
<li><strong>Immutable infrastructure</strong> &mdash; a server is replaced with a new image instead of being patched, which removes configuration drift (and is the answer to the misconfiguration vulnerability of Unit 8).</li>
<li><strong>Continuous delivery</strong> &mdash; many small deployments instead of rare large ones.</li>
<li><strong>Observability</strong> &mdash; logs, metrics and traces, because a system of many small services fails in many small ways.</li>
<li><strong>Horizontal scaling</strong> &mdash; load is handled by adding instances rather than enlarging one, which is elasticity applied in pieces.</li>
</ul>

<p><strong>Part 2 &mdash; How the three tools support it (4 marks).</strong></p>
<p><strong>Microservices provide the structure.</strong> The application is decomposed into <strong>small, independently deployable services, each owning its own data and communicating over a network interface</strong>. This is what makes independent scaling and independent deployment possible: only the service under load is scaled, and a change to one service does not require redeploying the rest. In this course's vocabulary, each service communicates <strong>only by passing messages</strong> (Unit 1), over <strong>web service interfaces</strong> (Unit 2.4), behind a <strong>remote interface</strong> (Unit 2.2) &mdash; and the cost is that every internal call becomes a remote call, with latency, marshalling, invocation semantics and the RPC failure modes attached. That cost is why the other two tools are necessary.</p>

<p><strong>Containers provide the packaging.</strong> Each service is packaged as an <strong>image containing the code, its dependencies and its configuration together</strong> &mdash; the container definition from the course material &mdash; and run as <strong>an isolated OS environment within the same host kernel</strong>, which makes containers more resource-efficient than virtual machines. Because the image carries its environment, deployment stops being a sequence of machine-specific installations and becomes the movement of one artefact: <strong>the environment is reproducible and portable</strong>, versioned like code, and identical everywhere. On the cloud that is what removes configuration drift and makes a service's behaviour predictable across development, test and production.</p>

<p><strong>Orchestration provides the operation.</strong> An orchestrator is needed because Docker alone does not decide <strong>placement</strong> (which container on which node), <strong>restarts and self-healing</strong> (what happens when a container or its node fails), <strong>scaling</strong> (adding and removing copies with load) or <strong>networking and discovery</strong> (a stable name when container addresses are not stable). <strong>Kubernetes solves all four, and its central idea is that you declare the desired state and the orchestrator continuously works to make the actual state match it</strong> &mdash; the same shape as the demand-driven provisioning of Unit 6.4, where a measured value is compared against a threshold and corrected. Concretely: <strong>pods</strong> are the smallest deployable units, <strong>nodes</strong> are the machines (the VMs of Units 6 and 7) that run them, the <strong>control plane</strong> schedules and reconciles, a <strong>deployment</strong> declares how many replicas of an image should run and supports <strong>rolling updates</strong> that replace pods gradually instead of stopping the service, a <strong>service</strong> gives a stable name and address in front of a changing set of pods and therefore <strong>load balancing</strong>, and <strong>self-healing</strong> restores the declared replica count when something fails. Providers sell this managed: <strong>GKE, EKS and AKS</strong>.</p>

<p><strong>Conclusion.</strong> The three fit together as a chain rather than a list: <strong>microservices need reproducible packaging, packaging needs an orchestrator to be useful at scale, and a system of many small services needs continuous delivery and observability to be operable</strong>. Remove the orchestrator and the architecture becomes a fleet of machines to babysit; remove the containers and every deployment becomes machine-specific; remove the microservices and there is nothing small enough to place and scale independently. And <em>serverless functions</em> (9.2) are the same progression one step further &mdash; the platform also decides when to run the code, and the customer deploys a function rather than a service.</p>

<div class="concept-box tip">
<h4>Where this came from</h4>
<p>Group C, question 15 of the <em>Model Question 2025</em>, marked <strong>[4+4]</strong> &mdash; two halves of 4 marks. Answer it in two headed parts. Note that the second half asks <em>how</em> the three tools support cloud-native architecture, so it wants one paragraph each describing a supporting role (structure, packaging, operation) rather than three separate descriptions; naming the cost of each &mdash; remote calls for microservices, the shared kernel for containers, the operational layer for Kubernetes &mdash; is what turns a description into a discussion. Fig 9.4 is that answer as a diagram.</p>
</div>`
    }
  ]
};
