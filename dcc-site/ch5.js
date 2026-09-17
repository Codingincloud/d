/* Chapter 5 — Introduction to Cloud Computing.

   Syllabus unit 5: 4 hours, 6 marks. Sub-topics 5.1 History and evolution of
   cloud, 5.2 Characteristics and benefits, 5.3 Cloud service models
   (IaaS, PaaS, SaaS), 5.4 Cloud deployment models (Public, Private, Hybrid,
   Community).

   Written from Er. Avijit Karn's 37-slide Chapter 5 deck, read into
   `_source/dcc/lecture_notes_all_chapterwise_ch_5_int_to_cloudcomputing.txt`
   by tools/dcc_extract.py. This deck was the legacy `.ppt` format, so it was
   converted through PowerPoint and then OCR'd — its figures are pictures, and
   the recovered labels (the evolution timeline, the four deployment models'
   security perimeters, the service-model stack and the advantage/disadvantage
   panel) are what the figures in this chapter are drawn from.

   Two blocks in this chapter come from the reference cloud deck rather than from
   Er. Karn's slides, which is why neither is attributed on the page:

     * the five essential characteristics of the defining characteristics (on-demand self-service,
       broad network access, resource pooling, rapid elasticity, measured
       service), which the class deck does not list in that form
     * the four rungs of the pizza analogy in 5.3 (made at home, take and bake,
       delivered, dining out), from that deck's "Pizza as a Service" slide

   The layer-by-layer responsibility table in 5.3 is neither: it is the three
   service-model definitions already in this chapter read as a boundary, one row
   per layer. Nothing in it asserts more than the definitions do — the row that
   matters, that the data stays the customer's at every level, is the one the
   security unit (8.4) then builds on.

   Three Model Question 2025 questions sit in this unit: Group A question 2
   (IaaS versus PaaS, 2 marks), Group B question 10 (features and benefits of
   cloud computing, 4 marks) and Group C question 13 (the four deployment
   models compared, 8 marks). */

window.CHAPTERS = window.CHAPTERS || {};
window.CHAPTERS[5] = {
  learn: `

<h2>Unit 5 &mdash; Introduction to Cloud Computing</h2>
<p class="unit-meta">Syllabus: 4 hours &middot; 6 marks &middot; sub-topics 5.1&ndash;5.4</p>

<h2>5.1 History and evolution of cloud</h2>

<h3>What cloud computing is &mdash; the two definitions</h3>
<p>Two definitions open the subject, and they say different things. The first is the infrastructure definition:</p>

<div class="concept-box key">
<p>&ldquo;Cloud computing is an information technology (IT) paradigm that enables ubiquitous access to shared pools of configurable system resources and higher-level services that can be rapidly provisioned with minimal management effort, often over the Internet. Cloud computing relies on sharing of resources to achieve coherence and economies of scale, similar to a public utility.&rdquo;
&mdash; the Wikipedia definition</p>
<p>&ldquo;Simply put, cloud computing is the delivery of computing services &mdash; servers, storage, databases, networking, software, analytics and more &mdash; over the Internet ("the cloud"). Companies offering these computing services are called <strong>cloud providers</strong> and typically charge for cloud computing services based on usage, similar to how you are billed for gas or electricity at home.&rdquo;
&mdash; the Azure definition</p>
</div>

<p>Read together, the first names the mechanism (shared pools of configurable resources, rapidly provisioned) and the second names the business model (delivery of services, metered by usage like a utility). The utility analogy is not decoration: it is the defining attribute in 5.2, and it is what separates cloud computing from a hosting service.</p>

<h3>The basic reasoning and the two early models</h3>
<p>The reasoning behind cloud computing, in one sentence: information and data processing can be done more efficiently on large farms of computing and storage systems accessible via the Internet. That idea produced two earlier models that are easy to confuse:</p>

<table class="comparison-table">
<thead>
<tr><th></th><th>Grid computing</th><th>Utility computing</th></tr>
</thead>
<tbody>
<tr><td>When</td><td>Initiated by the National Labs in the early 1990s.</td><td>Initiated in <strong>2005&ndash;2006</strong> by IT companies.</td></tr>
<tr><td><strong>Target</strong></td><td><strong>Scientific computing</strong>, primarily.</td><td><strong>Enterprise computing.</strong></td></tr>
<tr><td><strong>Definition</strong></td><td>&ldquo;Grid computing is the collection of computer resources from multiple locations to reach a common goal. The grid can be thought of as a distributed system with non-interactive workloads that involve a large number of files.&rdquo;</td><td>&ldquo;Utility computing is a service provisioning model in which a service provider makes computing resources and infrastructure management available to the customer as needed, and charges them for specific usage rather than a flat rate.&rdquo;</td></tr>
<tr><td>What it contributes to cloud</td><td>The idea of pooling resources from multiple locations for one goal &mdash; the unit of work is a batch job, not an interactive service.</td><td>The idea of <strong>renting by usage</strong> instead of buying &mdash; the utility billing model.</td></tr>
</tbody>
</table>
<h3>The five technologies, and the timeline</h3>
<p>The history, almost verbatim: cloud computing is all about renting computing services, and this idea first came in the 1950s. In making cloud computing what it is today, five technologies played a vital role: distributed systems and their peripherals, virtualization, Web 2.0, service orientation, and utility computing.</p>

<p>What each of the five contributes: Distributed systems and their peripherals allow one service to run across many machines at all. <strong>Virtualization</strong> supplies the isolation and multiplexing that let a provider sell slices of one machine to unrelated customers. <strong>Web 2.0</strong> supplies the always-reachable, browser-based interface, so that a user needs nothing installed. <strong>Service orientation</strong> supplies the interface idea itself &mdash; functionality that is called over a network rather than installed locally. Utility computing supplies the pricing: the shift from buying a machine to paying for what you use. The result arrived in 2007, and it is the last two of the five that make it a <em>service</em> rather than a very large cluster.</p>

<figure class="figure-wide figure-wrap">
<svg class="figure wide" viewBox="0 0 820 280" role="img" aria-label="Timeline of the evolution of cloud computing from mainframe computing in the 1950s through cluster and grid computing, distributed systems, virtualization, Web 2.0, service orientation and utility computing, arriving at cloud computing in 2007">
<defs><marker id="f5a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="flow-arrow-head"/></marker></defs>

<path class="flow-arrow" d="M40,196 H800" marker-end="url(#f5a)"/>

<rect class="flow-box phase4" x="30" y="150" width="96" height="36" rx="8"/>
<text class="flow-label" x="78" y="173" text-anchor="middle">1950s</text>

<rect class="flow-box phase1" x="150" y="96" width="120" height="40" rx="8"/>
<text class="flow-label" x="210" y="120" text-anchor="middle">Mainframe</text>
<rect class="flow-box phase1" x="150" y="150" width="120" height="36" rx="8"/>
<text class="flow-label" x="210" y="173" text-anchor="middle">Cluster</text>

<rect class="flow-box phase2" x="296" y="60" width="120" height="40" rx="8"/>
<text class="flow-label" x="356" y="84" text-anchor="middle">Grid computing</text>
<rect class="flow-box phase2" x="296" y="150" width="150" height="36" rx="8"/>
<text class="flow-label" x="371" y="173" text-anchor="middle">Distributed systems</text>

<rect class="flow-box phase3" x="466" y="96" width="130" height="40" rx="8"/>
<text class="flow-label" x="531" y="120" text-anchor="middle">Virtualization</text>
<rect class="flow-box phase3" x="466" y="150" width="130" height="36" rx="8"/>
<text class="flow-label" x="531" y="173" text-anchor="middle">Web 2.0</text>

<rect class="flow-box phase4" x="622" y="60" width="140" height="40" rx="8"/>
<text class="flow-label" x="692" y="84" text-anchor="middle">Service orientation</text>
<rect class="flow-box phase4" x="622" y="150" width="140" height="36" rx="8"/>
<text class="flow-label" x="692" y="173" text-anchor="middle">Utility computing</text>

<rect class="flow-box phase1" x="622" y="212" width="140" height="44" rx="9"/>
<text class="flow-text" x="692" y="240">Cloud computing</text>
<path class="flow-arrow" d="M692,188 V208" marker-end="url(#f5a)"/>
<text class="flow-label" x="692" y="50" text-anchor="middle" opacity="0.85">2007</text>

<text class="flow-label" x="400" y="30" text-anchor="middle">Five technologies made cloud computing possible: distributed systems and their peripherals, virtualization,</text>
<text class="flow-label" x="400" y="248" text-anchor="middle">Web 2.0, service orientation, and utility computing.</text>
</svg>
<figcaption>Fig 5.1 &mdash; The evolution of the field. Mainframe computing in the 1950s, then cluster and grid computing, distributed systems, virtualization, Web 2.0, service orientation and utility computing, arriving at cloud computing in 2007. The arrow of the timeline is a dependency chain, not just a date order: each stage supplies something the next needs &mdash; virtualization supplies the isolation and multiplexing, service orientation supplies the interface, and utility computing supplies the pricing.</figcaption>
</figure>
<h3>The three axes of cloud computing</h3>
<p>Three axes organise the unit's models: what the provider supplies, who the cloud is for, and what makes it cloud rather than hosting.</p>

<p>The table separates three things that are easy to blur together: what the provider supplies and what you pay for (the delivery models, 5.3), who controls the infrastructure and where it sits (the deployment models, 5.4). The third is what makes it cloud rather than ordinary hosting (the defining attributes, 5.2 &mdash; utility pricing, Internet access and elasticity). Naming the axis is what keeps the three apart, and the definition of a deployment model exists to keep the first two of them separate.</p>
<table class="comparison-table">
<thead>
<tr><th>Axis</th><th>Values</th><th>Covered in</th></tr>
</thead>
<tbody>
<tr><td><strong>Delivery (service) models</strong><br><span class="muted">what the provider supplies</span></td><td>Software as a Service (SaaS), Platform as a Service (PaaS), Infrastructure as a Service (IaaS)</td><td>5.3</td></tr>
<tr><td><strong>Deployment models</strong><br><span class="muted">who the cloud is for and where the control sits</span></td><td>Public cloud, Private cloud, Community cloud, Hybrid cloud</td><td>5.4</td></tr>
<tr><td><strong>Defining attributes</strong></td><td>Utility computing / pay-per-usage; accessible via the Internet; elasticity</td><td>5.2</td></tr>
<tr><td>Resources the cloud is built from</td><td>Distributed infrastructure, resource virtualization, autonomous systems, compute and storage servers, networks, applications</td><td>&mdash;</td></tr>
</tbody>
</table>
<h2>5.2 Characteristics and benefits</h2>

<h3>The defining characteristics</h3>
<p>The defining sentence: &ldquo;Cloud Computing offers on-demand, scalable and elastic computing (and storage services). The resources used for these services can be metered and users are charged only for the resources used.&rdquo; The breakdown is four points:</p>
<ul>
<li>Shared resources and resource management &mdash; the cloud uses a shared pool of resources.</li>
<li>Internet technology for scalable and elastic services &mdash; the key term is defined precisely: &ldquo;elastic computing&rdquo; refers to the ability to dynamically and on-demand acquire computing resources and support a variable workload.</li>
<li><strong>Metering</strong> &mdash; resources are metered and users are charged accordingly.</li>
<li><strong>Cost-effectiveness from resource multiplexing</strong> &mdash; lower costs for the cloud service provider are passed to the cloud users.</li>
</ul>
<div class="concept-box key">
<h4>The five essential characteristics</h4>
<p>The list that most cloud material is written against is a different one, and it belongs beside the four points above &mdash; the NIST definition's five essential characteristics, one sentence each:</p>
<ul>
<li><strong>On-demand self-service</strong> &mdash; a consumer can provision computing capability unilaterally and automatically, with no human interaction with the provider.</li>
<li><strong>Broad network access</strong> &mdash; the capabilities are reachable over the network through standard mechanisms, so thin and thick clients alike can use them.</li>
<li><strong>Resource pooling</strong> &mdash; the provider's resources serve several consumers under a multi-tenant model, assigned and reassigned dynamically, and the consumer has no knowledge of or control over their exact location.</li>
<li><strong>Rapid elasticity</strong> &mdash; capabilities can be provisioned and released elastically, so they appear unlimited to the consumer.</li>
<li><strong>Measured service</strong> &mdash; resource use is monitored, controlled and reported, which is what makes pay-as-you-go possible.</li>
</ul>

<h4>Scalability versus elasticity</h4>
<p>These are the two words most easily confused in the whole unit. Scalability is the ability of the system to handle growth &mdash; the capacity is there, or can be added, to meet a larger load. Elasticity is the ability to acquire resources dynamically and on demand for a variable workload, and to release them again. A system can be scalable without being elastic (you add servers by hand and keep them), and the cloud's distinguishing property is elasticity: resources are acquired and released automatically, and you are billed for what you actually used. Elasticity is what makes workloads with very large peak-to-average ratios economic.</p>
</div>

<h3>Two more characteristics</h3>
<table class="comparison-table">
<thead>
<tr><th>Characteristic</th><th>What it means</th></tr>
</thead>
<tbody>
<tr><td><strong>Data storage</strong></td><td>Data is stored in the cloud, in certain cases closer to the site where it is used, and appears to the users as if stored in a location-independent manner. The storage strategy can increase reliability as well as security, and lower communication costs. This is <em>location transparency</em> applied to data.</td></tr>
<tr><td><strong>Management</strong></td><td>The maintenance and security are operated by service providers, who can operate more efficiently due to specialisation and centralisation. This is the characteristic that produces the "no administrative or management hassles" advantage &mdash; and the objection that relinquishing control becomes a security question.</td></tr>
</tbody>
</table>

<h4>Location transparency for data</h4>
<p><em>Data storage</em> is location transparency applied to data: a user of cloud storage cannot tell where the bytes are, and the provider places them where they are cheapest or closest to use. That is how a cloud claims better reliability and lower communication cost than a machine under a desk. It is also why the security question is about who else can reach that data rather than about which building holds it.</p>

<h4>The commercial trade-off of management</h4>
<p><em>Management</em> is the commercial half: because maintenance and security become the provider's job, the tenant's own administrative burden disappears. The objection belongs next to the advantage: the centralisation that makes a provider efficient is exactly what makes one outage, or one bad policy, affect every tenant at the same time.</p>
<h3>The benefits</h3>
<p>The advantages of cloud computing fall into four families:</p>
<table class="comparison-table">
<thead>
<tr><th>Family</th><th>Benefit</th><th>The reasoning behind it</th></tr>
</thead>
<tbody>
<tr><td rowspan="3"><strong>Efficiency through sharing</strong></td><td>Shared resources</td><td>CPU cycles, storage and network bandwidth are shared.</td></tr>
<tr><td>Higher utilisation through multiplexing</td><td>When multiple applications share a system, their peak demands for resources are not synchronised; thus multiplexing leads to higher resource utilisation. This is the technical reason the economics work &mdash; the provider sells the same hardware many times over because nobody's peak coincides.</td></tr>
<tr><td>Aggregation for data-intensive work</td><td>Resources can be aggregated to support data-intensive applications, and data sharing facilitates collaborative activities &mdash; many applications need multiple types of analysis of shared data sets and multiple decisions made by groups scattered around the globe.</td></tr>
<tr><td rowspan="2"><strong>Cost</strong></td><td>No capital investment</td><td>It eliminates the initial investment costs for a private computing infrastructure, and the maintenance and operation costs.</td></tr>
<tr><td>Pay-as-you-go</td><td>Cost reduction: the concentration of resources creates the opportunity to pay as you go for computing.</td></tr>
<tr><td rowspan="2"><strong>Capability</strong></td><td>Elasticity</td><td>The ability to accommodate workloads with very large peak-to-average ratios.</td></tr>
<tr><td>User convenience</td><td>Virtualization allows users to operate in familiar environments rather than in idiosyncratic ones.</td></tr>
</tbody>
</table>

<p>Why cloud computing succeeded where earlier paradigms did not:</p>
<ul>
<li><strong>Technology timing</strong> &mdash; it is in a better position to exploit recent advances in software, networking, storage and processor technologies, promoted by the same companies that provide the services.</li>
<li><strong>Economics</strong> &mdash; it is used for enterprise computing, and its adoption by industrial organisations, financial institutions, government and so on has a huge impact on the economy.</li>
<li><strong>Infrastructure management</strong> &mdash; a single cloud consists of a mostly homogeneous (now more heterogeneous) set of hardware and software resources, and the resources are in a single administrative domain. That last point is the technical one: security, resource management, fault tolerance and quality of service are less challenging than in a heterogeneous environment with resources in multiple administrative domains.</li>
</ul>
<div class="concept-box tip">
<h4>The advantage/limitation panel</h4>
<p>Advantages and costs fall into two columns, each benefit beside the price it carries: <strong>advantages</strong> &mdash; no cost of infrastructure, minimum management and cost, no administrative or management hassles, easy accessibility, pay per use, reliability, and the backup, recovery and storage capacity the provider supplies. The drawbacks: a good internet connection and bandwidth required, downtimes, <strong>loss of control</strong>, because the provider holds the data, restricted or limited flexibility, ongoing costs, security, vendor lock-in, technical issues. Vendor lock-in and loss of control are the two that reappear as <em>diversity of services</em> and <em>data confidentiality</em>, and in the de-perimeterisation discussion.</p>
</div>
<h3>Challenges</h3>
<p>The challenges sit beside the advantages, one line each:</p>
<table class="comparison-table">
<thead>
<tr><th>Challenge</th><th>What it is</th></tr>
</thead>
<tbody>
<tr><td><strong>Availability of service</strong></td><td>What happens when the service provider cannot deliver?</td></tr>
<tr><td>Data confidentiality and auditability</td><td>Confidentiality of stored data depends on the provider's controls, and auditability is limited because the customer does not run the system it depends on.</td></tr>
<tr><td><strong>Vendor lock-in</strong></td><td>Diversity of services, data organisation and user interfaces at different providers limits user mobility: once a customer is hooked to one provider it is hard to move to another.</td></tr>
<tr><td><strong>Data transfer bottleneck</strong></td><td><strong>Many applications are data-intensive</strong>, so moving the data is itself the cost.</td></tr>
<tr><td><strong>Performance unpredictability</strong></td><td>One of the consequences of resource sharing. The questions it raises: how to use resource virtualization and performance isolation for QoS guarantees, and how to support elasticity &mdash; the ability to scale up and down quickly.</td></tr>
<tr><td><strong>Resource management</strong></td><td>It is a big challenge to manage different workloads running on large data centres &mdash; with self-organisation and self-management offered as the possible answer. </td></tr>
<tr><td>Security and confidentiality</td><td>A major concern for sensitive applications, for example healthcare.</td></tr>
</tbody>
</table>

<h2>5.3 Cloud service models: IaaS, PaaS, SaaS</h2>

<p>The three service models are a stack, ordered by level: Software as a Service (high level), Platform as a Service, Infrastructure as a Service (low level). The layers show which layer the customer controls and which the provider does.</p>

<figure class="figure-wide figure-wrap">
<svg class="figure wide" viewBox="0 0 780 420" role="img" aria-label="Cloud service model stack from top to bottom: cloud clients, then Software as a Service supplying applications, Platform as a Service supplying runtime and middleware, and Infrastructure as a Service supplying virtualization, servers, storage and networking; each model bounds the part the customer manages">
<defs><marker id="f5b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="flow-arrow-head"/></marker></defs>

<rect class="flow-box phase4" x="40" y="34" width="700" height="46" rx="9"/>
<text class="flow-text" x="390" y="62">Cloud clients &mdash; web browser, mobile app, thin client, terminal emulator</text>

<rect class="flow-box phase1" x="40" y="104" width="700" height="70" rx="9"/>
<text class="flow-text" x="390" y="132">Software as a Service &mdash; applications</text>
<text class="flow-label" x="390" y="156" text-anchor="middle">CRM, email, virtual desktop, communication, games &mdash; supplied by the provider</text>

<rect class="flow-box phase2" x="40" y="198" width="700" height="70" rx="9"/>
<text class="flow-text" x="390" y="226">Platform as a Service &mdash; runtime and middleware</text>
<text class="flow-label" x="390" y="250" text-anchor="middle">execution runtime, database, web server, development tools</text>

<rect class="flow-box phase3" x="40" y="292" width="700" height="94" rx="9"/>
<text class="flow-text" x="390" y="320">Infrastructure as a Service &mdash; the infrastructure</text>
<text class="flow-label" x="390" y="344" text-anchor="middle">virtual machines, servers, storage, load balancers, network</text>
<text class="flow-label" x="390" y="368" text-anchor="middle">(behind it: virtualization, servers, storage and networking &mdash; the layers the customer never sees)</text>

<text class="flow-label" x="390" y="410" text-anchor="middle">Moving down the stack, the customer manages more and the provider less.</text>
</svg>
<figcaption>Fig 5.2 &mdash; The three delivery models as a stack. The client row at the top is part of the model, which is defined by what reaches the user.</figcaption>
</figure>
<table class="comparison-table">
<thead>
<tr><th></th><th>IaaS (low level)</th><th>PaaS</th><th>SaaS (high level)</th></tr>
</thead>
<tbody>
<tr><td>What the provider gives you</td><td><strong>Infrastructure</strong>: compute resources, CPU, VMs, storage.</td><td>A <strong>platform</strong>: the ability to deploy consumer-created or acquired applications using programming languages and tools supported by the provider.</td><td>Applications supplied by the service provider.</td></tr>
<tr><td><strong>What the customer controls</strong></td><td>Can deploy and run arbitrary software, including operating systems and applications. Does not manage or control the underlying cloud infrastructure, but has control over operating systems, storage, deployed applications, and possibly limited control of some networking components such as host firewalls.</td><td>Has control over the deployed applications and possibly application hosting environment configurations. Does not manage or control the underlying cloud infrastructure, including network, servers, operating systems or storage.</td><td>Does not manage or control the underlying cloud infrastructure or individual application capabilities.</td></tr>
<tr><td><strong>Services offered</strong></td><td>Server hosting, storage, computing hardware, operating systems, virtual instances, load balancing, Internet access, bandwidth provisioning.</td><td>The runtime, database, web server and development tools the application is built on.</td><td>Enterprise services such as workflow management, communications, digital signature, customer relationship management (CRM), desktop software, financial management, geo-spatial and search.</td></tr>
<tr><td><strong>Examples</strong></td><td><strong>Amazon EC2</strong></td><td>Google App Engine, Windows Azure</td><td>Gmail, Salesforce</td></tr>
<tr><td>Not a good fit when</td><td>&mdash;</td><td>The application must be portable; proprietary programming languages are used; or the hardware and software must be customised to improve the performance of the application.</td><td><strong>Real-time applications</strong>, or those where data is not allowed to be hosted externally.</td></tr>
</tbody>
</table>
<div class="concept-box key">
<h4>IaaS against PaaS in two sentences</h4>
<p>IaaS provides the infrastructure itself &mdash; virtual machines, servers, storage, load balancers and network &mdash; so the customer controls the operating systems, storage and deployed applications, and can run arbitrary software. PaaS provides a hosted platform of runtime, database, web server and development tools, so the customer controls only the deployed application and its configuration and never the servers, operating systems or storage. The one-line version: <em>IaaS rents you the machine, PaaS rents you the runtime, SaaS rents you the application.</em> PaaS is a poor fit when the application must be portable or must run on customised hardware.</p>
</div>

<div class="example-box">
<h4>The boundary the service models draw &mdash; who manages which layer</h4>
<p>All three definitions above are answering one question, and it is the same at every level: where does the provider's responsibility stop? The stack bottom-up, as the layers a running application stands on:</p>
<table class="comparison-table">
<thead>
<tr><th>Layer</th><th>IaaS</th><th>PaaS</th><th>SaaS</th></tr>
</thead>
<tbody>
<tr><td><strong>Networking</strong></td><td>Provider, with limited customer control such as a host firewall</td><td>Provider</td><td>Provider</td></tr>
<tr><td><strong>Storage</strong></td><td>Provider supplies the volumes; the customer decides what is stored</td><td>Provider</td><td>Provider</td></tr>
<tr><td><strong>Servers</strong></td><td>Provider operates them; the customer consumes virtual machines</td><td>Provider</td><td>Provider</td></tr>
<tr><td><strong>Virtualization</strong></td><td>Provider</td><td>Provider</td><td>Provider</td></tr>
<tr><td><strong>Operating system</strong></td><td><strong>Customer</strong> &mdash; the guest OS is theirs to configure and patch</td><td>Provider</td><td>Provider</td></tr>
<tr><td><strong>Middleware</strong></td><td><strong>Customer</strong></td><td>Provider</td><td>Provider</td></tr>
<tr><td><strong>Runtime</strong></td><td><strong>Customer</strong></td><td><strong>Provider</strong> &mdash; the platform is what is being sold</td><td>Provider</td></tr>
<tr><td><strong>Data</strong></td><td><strong>Customer</strong></td><td><strong>Customer</strong></td><td><strong>Customer</strong></td></tr>
<tr><td><strong>Application</strong></td><td><strong>Customer</strong></td><td><strong>Customer</strong></td><td><strong>Provider</strong> &mdash; the application is the service</td></tr>
</tbody>
</table>
<p>Two rows are the ones to hold on to. <em>Data is the customer's at every level</em>: the provider may hold it, but never owns it, which is why the security obligations split rather than transfer in 8.4. And the boundary only ever moves one way &mdash; going from IaaS to SaaS the provider takes on more of the stack and the customer less, until what is left on the customer's side is the data and the decision to keep using the service.</p>

<div class="concept-box tip">
<h4>The same boundary, as a pizza</h4>
<p>Four rungs, one per model; only where the line falls changes:</p>
<ul>
<li><strong>On premises</strong> &mdash; made at home: the dough, sauce, toppings, cheese, oven, heat and table are all yours.</li>
<li><strong>IaaS</strong> &mdash; take and bake: the provider supplies the pizza, and you supply the oven, the heat and the table. You still have to run it.</li>
<li><strong>PaaS</strong> &mdash; delivered: the provider brings the finished pizza, and you set the table and decide what else is served with it.</li>
<li><strong>SaaS</strong> &mdash; dining out: the kitchen is the provider's entirely, and all you have is the seat.</li>
</ul>
<p>Across the four rungs the vendor manages more and the customer manages less, and the customer never stops being responsible for what they put in and what they do with it.</p>
</div>

<h4>Example: Amazon Web Services (AWS)</h4>
<p>Amazon EC2 is the classic example of Infrastructure as a Service (IaaS), providing raw virtual machines and infrastructure that the customer controls.</p>
</div>

<div class="example-box">
<h4>Example: Google Cloud Platform (GCP)</h4>
<p>Google App Engine is a prime example of Platform as a Service (PaaS), offering a hosted platform for applications without managing the underlying servers.</p>
</div>

<div class="example-box">
<h4>Example: Microsoft Azure</h4>
<p>Windows Azure provides both PaaS and IaaS solutions, commonly used for enterprise deployment and hosted platforms.</p>
</div>

<h3>Cloud activities &mdash; what a provider actually operates</h3>
<p>The activities a cloud service involves:</p>
<ul>
<li>Service management and provisioning: virtualization, service provisioning, call centre, operations management, systems management, <strong>QoS management</strong>, billing and accounting, asset management, <strong>SLA management</strong>, technical support and backups.</li>
<li><strong>Security management</strong>: identity and authentication, certification and accreditation, intrusion prevention, intrusion detection, virus protection, cryptography, physical security, incident response, access control, audit and trails, firewalls.</li>
<li><strong>Customer services</strong>: customer assistance and online help, subscriptions, business intelligence, reporting, customer preferences, personalisation.</li>
<li><strong>Integration services</strong>: data management and development.</li>
</ul>

<p>The four lists map the jobs a provider has to staff, and much of it is not computing at all. Only <em>service provisioning</em> and <em>integration</em> are about running workloads; everything else is the commercial and operational machinery &mdash; billing, SLAs, technical support, subscriptions, reporting, access control and audit. The virtualized infrastructure is necessary and nowhere near sufficient; the parts a customer actually judges the service on are in the middle list.</p>

<h2>5.4 Cloud deployment models: Public, Private, Hybrid, Community</h2>

<h3>What a deployment model is</h3>
<p> The four models are configurations of one infrastructure, so the definition is stated in terms of <em>who controls it and where it sits</em> rather than what it is built from.</p>
<p>Two definitions are given, and the second is the more complete: deployment models define the type of access to the cloud, that is, how the cloud is located. More fully: a cloud deployment model is a specific configuration of environment parameters such as the accessibility and proprietorship of the deployment infrastructure and storage size &mdash; which means deployment types vary depending on who controls the infrastructure and where it is located. A cloud can have any of four types of access: Public, Private, Hybrid and Community.</p>
<p>The definition is about <strong>configuration</strong> rather than technology: what separates the four models is not the hardware but <em>who controls the infrastructure and where it sits relative to the user</em> &mdash; the proprietorship and the accessibility. That is why the same physical data centre can be a public cloud for one customer and a private cloud for another, and why the comparison rates the four on security, control and cost rather than on capability. In each row they differ by <em>whose</em> system it is, not by what it can do. The infrastructural constraints shown beside this material &mdash; transparency, security, scalability and intelligent monitoring &mdash; are the properties any cloud infrastructure has to hold, whichever of the four it implements.</p>
<h3>The four models</h3>

<table class="comparison-table">
<thead>
<tr><th>Model</th><th>Definition</th><th>Ownership and control</th></tr>
</thead>
<tbody>
<tr><td><strong>Public cloud</strong></td><td>The infrastructure is made available to the general public or a large industry group and is owned by the organisation selling cloud services.</td><td>Services are provided on a network for public use; customers have no control over the location of the infrastructure. It is based on a shared cost model for all users, or a licensing policy such as pay per user.</td></tr>
<tr><td><strong>Private cloud</strong></td><td>The infrastructure is operated solely for an organisation. Technically there is little to no difference from a public model &mdash; the architectures are very similar &mdash; but only one specific company owns it, which is why it is also called an internal or corporate model.</td><td>The server can be hosted externally or on the premises of the owner company. Regardless of physical location, these infrastructures are maintained on a designated private network and use software and hardware intended only for the owner company. A clearly defined scope of people has access, which prevents the general public from using it.</td></tr>
<tr><td><strong>Community cloud</strong></td><td>The infrastructure is shared by several organisations and supports a community that has shared concerns. It largely resembles the private model &mdash; the only difference is the set of users: instead of one company, several organisations with similar backgrounds share the infrastructure and related resources.</td><td>A mutually shared model between organisations belonging to a particular community &mdash; banks, government organisations or commercial enterprises &mdash; which generally share similar issues of privacy, performance and security. It is managed and hosted internally or by a third-party vendor.</td></tr>
<tr><td><strong>Hybrid cloud</strong></td><td>A composition of two or more clouds (public, private or community) as unique entities but bound by standardised technology that enables data and application portability.</td><td>It allows companies to mix and match the facets of the three types that best suit their requirements &mdash; for example, balancing load by locating mission-critical workloads on a secure private cloud and deploying less sensitive ones to a public one.</td></tr>
</tbody>
</table>

<h3>The comparison table</h3>
<p>The use cases follow from the same comparison.</p>

<table class="comparison-table">
<thead>
<tr><th></th><th>Public</th><th>Private</th><th>Community</th><th>Hybrid</th></tr>
</thead>
<tbody>
<tr><td><strong>Ownership</strong></td><td>The provider, which sells cloud services to the public or a large industry group.</td><td>The organisation itself &mdash; also called an internal or corporate model.</td><td>Several organisations with shared concerns; managed internally or by a third party.</td><td>A composition of two or more of the other three, bound by standardised technology.</td></tr>
<tr><td><strong>Where the infrastructure sits</strong></td><td>At the provider's data centres, and the customer has no control over the location.</td><td>On the owner's premises or hosted externally &mdash; on a designated private network either way.</td><td>Internal or third-party hosted, and reachable only by the community.</td><td>Mission-critical workloads on the private part, less sensitive ones on the public part.</td></tr>
<tr><td>Ease of setup and use</td><td><strong>Easy</strong></td><td>Requires IT proficiency</td><td>Requires IT proficiency</td><td>Requires IT proficiency</td></tr>
<tr><td>Data security and privacy</td><td><strong>Low</strong></td><td><strong>High</strong></td><td>Comparatively high</td><td><strong>High</strong></td></tr>
<tr><td><strong>Data control</strong></td><td><strong>Little to none</strong></td><td><strong>High</strong></td><td>Comparatively high</td><td>Comparatively high</td></tr>
<tr><td><strong>Reliability</strong></td><td><strong>Low</strong></td><td><strong>High</strong></td><td>Comparatively high</td><td><strong>High</strong></td></tr>
<tr><td>Scalability and flexibility</td><td><strong>High</strong></td><td><strong>High</strong></td><td><strong>Fixed capacity</strong></td><td><strong>High</strong></td></tr>
<tr><td><strong>Cost-effectiveness</strong></td><td><strong>The cheapest</strong></td><td>Cost-intensive; the most expensive model</td><td>Cost is shared among community members</td><td>Cheaper than a private model but more costly than a public one</td></tr>
<tr><td><strong>Demand for in-house hardware</strong></td><td><strong>No</strong></td><td>Depends</td><td>Depends</td><td>Depends</td></tr>
</tbody>
</table>

<p>Read down a column and the four models are four settings of one trade: <strong>control against convenience</strong>. The public cloud is cheapest and easiest to start with and gives up security, control and reliability. The private cloud is the opposite in every one of those rows and pays for it in cost. The hybrid is the attempt to buy the elastic part cheaply from a public cloud while keeping the sensitive part in-house, which is why it lands between the two on cost and above the public model on control. The community cloud is the one row that is not "high" &mdash; <em>fixed capacity</em> &mdash; because its resources are pooled for a defined group rather than offered elastically to the world. Which one is right depends on how much control the workload needs.</p>

<h3>Advantages, disadvantages and use cases for each</h3>

<table class="comparison-table">
<thead>
<tr><th>Model</th><th>Advantages</th><th>Disadvantages</th><th>Suitable use case</th></tr>
</thead>
<tbody>
<tr><td><strong>Public</strong></td><td><strong>Hassle-free infrastructure management</strong> (a third party runs it; no software to develop and maintain, and setup and use are uncomplicated); high scalability (extend capacity as requirements increase); reduced costs (pay only for the service used, no hardware or software investment); 24/7 uptime from the provider's server network.</td><td><strong>Compromised reliability</strong> &mdash; the same network meant to ensure against failure still experiences outages and malfunction, citing the 2016 Salesforce CRM disruption that caused a storage collapse. Data security and privacy issues &mdash; access is easy, but users are deprived of knowing where their information is kept and who has access to it. Lack of a bespoke service &mdash; providers have only standardised service options, so complex requirements go unsatisfied.</td><td>Organisations with growing and fluctuating demands, and businesses of all sizes using it for web applications, webmail and storage of non-sensitive data. It is the first choice for businesses with low privacy concerns, and the examples are Amazon EC2, Microsoft Azure, Google App Engine, IBM Cloud and Salesforce Heroku.</td></tr>
<tr><td><strong>Private</strong></td><td>All its benefits <strong>result from its autonomy</strong>: bespoke and flexible development and high scalability, letting a company customise its infrastructure to its requirements; and high security, privacy and reliability, since only authorised persons can access resources.</td><td><strong>Cost</strong> &mdash; considerable expense on hardware, software and staff training, which is why it is not the right choice for small companies.</td><td>Companies that seek to safeguard their mission-critical operations, and businesses with constantly changing requirements where customisation matters. Because of recent breaches, a growing number of large corporations has decided on a closed private cloud model to minimise data security issues. Examples: Amazon, IBM, Cisco, Dell and Red Hat also provide private solutions.</td></tr>
<tr><td><strong>Community</strong></td><td><strong>Cost reduction</strong> (shared by all members); improved security, privacy and reliability; ease of data sharing and collaboration. Where all participating organisations have uniform security, privacy and performance requirements, this multi-tenant data-centre architecture helps them enhance efficiency, and a centralised cloud facilitates project development, management and implementation.</td><td>High cost compared to the public deployment model, and sharing of fixed storage and bandwidth capacity &mdash; the "fixed capacity" row of the comparison table.</td><td>Joint projects between organisations with a shared concern: banks with the same regulatory obligations, government organisations, universities or commercial enterprises &mdash; the three standard examples of a community.</td></tr>
<tr><td><strong>Hybrid</strong></td><td>Improved security and privacy (sensitive workloads stay private), enhanced scalability and flexibility (burst into the public cloud), and a reasonable price; it also facilitates data and application portability, which is the condition for calling it hybrid at all.</td><td>Because it encompasses the other three models, it inherits their management overheads, and it requires standardised technology that enables data and application portability &mdash; with the other models' drawbacks (IT proficiency, ongoing costs, vendor lock-in) still applying to the parts.</td><td>A company balancing load by locating mission-critical workloads on a secure private cloud and deploying less sensitive ones to a public one &mdash; which safeguards and controls strategically important assets in a cost- and resource-effective way. In practice: a bank keeping customer records private while serving its public website from a public cloud; a retailer that runs on private infrastructure and bursts to public capacity for festive demand.</td></tr>
</tbody>
</table>

<div class="concept-box key">
<h4>The four models in one panel</h4>
<p>A deployment model is the configuration of accessibility and proprietorship &mdash; who controls the infrastructure and where it is located. The four are Public, Private, Community and Hybrid. Each carries one advantage and one disadvantage and suits one kind of organisation: a public cloud for a fluctuating web workload, a private cloud for mission-critical operations under one company's control. A community cloud suits a joint bank or government project, and a hybrid suits a private core with public burst capacity. <em>Federated</em> is sometimes named as a related type.</p>
</div>

<h3>Ethical issues and de-perimeterisation</h3>
<p class="prereq-note">Outside the syllabus &mdash; 5.4 names four deployment models with their advantages, disadvantages and use cases. Ethical issues are background: control of data handed to providers, and the loss of the network perimeter.</p>
<p>Two consequences of moving to the cloud follow, and both are about control rather than technology.</p>

<p>The paradigm shift and its ethical implications: control is relinquished to third-party services; data is stored on multiple sites administered by several organisations; and multiple services interoperate across the network. The implications are unauthorized access, data corruption, and infrastructure failure and service unavailability.</p>

<h4>De-perimeterisation</h4>
<p>Systems can span the boundaries of multiple organisations and cross security borders. The traditional network boundary stops being the place where security is enforced. De-perimeterisation is the removal of a boundary between an organisation and the outside world &mdash; protecting systems and data on multiple levels using a mixture of encryption, secure protocols, secure systems and data-level authentication, rather than relying on the network boundary to the Internet.</p>

<div class="concept-box warn">
<h4>The consequence of removing the perimeter</h4>
<p>Successful de-perimeterisation means the outer security boundary <em>was removed</em>. Once the perimeter is gone, identity and access management and data-level security are the only controls left.</p>
</div>

<h4>New security risks</h4>
<p>The complex structure of cloud services can make it difficult to determine who is responsible when something undesirable happens. A further consequence is that identity fraud and theft are made possible by unauthorised access to personal data in circulation and by new forms of dissemination through social networks.</p>
<p class="past-pointer">Questions on this unit, with model answers, are on the <a href="#/ch/5/past">Past Questions</a> tab.</p>
`,

  revise: {"5.3":"<p>The three service models are a stack: <strong>Software as a Service</strong>, <strong>Platform as a Service</strong> and <strong>Infrastructure as a Service</strong>.</p>\n<ul>\n<li>IaaS gives the infrastructure &mdash; compute resources, CPU, VMs and storage &mdash; and the customer may run arbitrary software; Amazon EC2 is the example.</li>\n<li>PaaS gives a platform on which to deploy applications using tools the provider supports; the customer controls only the application.</li>\n<li>SaaS gives applications supplied by the provider, such as Gmail and Salesforce.</li>\n</ul>\n","what-cloud-computing-is-the-two-definitions":"<p>The two definitions name different things: the mechanism and the business model.</p>\n<ul>\n<li>The infrastructure definition: <strong>ubiquitous access to shared pools of configurable system resources</strong> that can be rapidly provisioned with minimal management effort.</li>\n<li>The business definition: the delivery of computing services over the Internet, charged by usage like a public utility.</li>\n<li>Companies offering them are <strong>cloud providers</strong>.</li>\n<li>The utility analogy is the defining attribute, and it is what separates cloud computing from hosting.</li>\n</ul>\n","the-basic-reasoning-and-the-two-early-models":"<p>The reasoning: information and data processing can be done more efficiently on large farms of computing and storage systems accessible via the Internet.</p>\n<ul>\n<li><strong>Grid computing</strong>, from the National Labs in the early 1990s, targets scientific computing: resources from multiple locations pooled for a common goal.</li>\n<li><strong>Utility computing</strong>, from IT companies in 2005&ndash;2006, targets enterprise computing and charges for specific usage rather than a flat rate.</li>\n<li>Grid contributes the pooling of resources for one goal; utility contributes billing by usage instead of buying.</li>\n</ul>\n","the-five-technologies-and-the-timeline":"<p>Five technologies made cloud computing what it is: distributed systems and their peripherals, virtualization, Web 2.0, service orientation and utility computing.</p>\n<ul>\n<li>Virtualization supplies the isolation and multiplexing, so a provider can sell slices of one machine.</li>\n<li>Web 2.0 supplies the browser-based interface, so a user needs nothing installed.</li>\n<li>Service orientation supplies the interface idea, and utility computing the pricing.</li>\n<li>The idea came in the 1950s and the result arrived in 2007.</li>\n</ul>\n","the-three-axes-of-cloud-computing":"<p>Three axes keep the unit's models apart.</p>\n<ul>\n<li>Delivery (service) models: what the provider supplies &mdash; <strong>SaaS</strong>, <strong>PaaS</strong> and <strong>IaaS</strong>.</li>\n<li>Deployment models: who the cloud is for and where the control sits &mdash; public, private, community, hybrid.</li>\n<li>Defining attributes: what makes it cloud rather than ordinary hosting &mdash; utility pricing, Internet access and <strong>elasticity</strong>.</li>\n<li>A fourth list names the resources the cloud is built from.</li>\n</ul>\n","the-defining-characteristics":"<p>Cloud computing offers on-demand, scalable and elastic computing, with resources metered and charged by use.</p>\n<ul>\n<li>A shared pool of resources, with resource management.</li>\n<li>Internet technology for scalable and elastic services; <strong>elastic computing</strong> acquires resources on demand to support a variable workload.</li>\n<li>Metering, and cost-effectiveness from resource multiplexing passed on to users.</li>\n<li><strong>Scalability</strong> is the ability to handle growth; elasticity is acquiring and releasing resources automatically, which is the cloud's distinguishing property.</li>\n</ul>\n","two-more-characteristics":"<p>Two further characteristics are <strong>data storage</strong> and <strong>management</strong>.</p>\n<ul>\n<li>Data storage: data is held in the cloud, closer to where it is used, and appears to users in a location-independent manner.</li>\n<li>The storage strategy can increase reliability and security, and lower communication cost &mdash; location transparency applied to data.</li>\n<li>Management: maintenance and security are operated by the providers, who are more efficient through specialisation and centralisation.</li>\n<li>The objection is that relinquishing control becomes a security question.</li>\n</ul>\n","the-benefits":"<p>The benefits fall into four families: sharing, cost, capability and user convenience.</p>\n<ul>\n<li>Sharing: CPU cycles, storage and bandwidth are shared, and peak demands do not coincide, so multiplexing raises utilisation.</li>\n<li>Aggregation: resources can be aggregated for data-intensive work, and shared data facilitates collaboration.</li>\n<li>Cost: no capital investment for a private infrastructure, and payment as you go for computing.</li>\n<li>Capability and convenience: elasticity accommodates very large peak-to-average ratios, and virtualization lets users work in familiar environments.</li>\n</ul>\n","challenges":"<p>The challenges sit beside the advantages, one line each.</p>\n<ul>\n<li><strong>Availability of service</strong>: what happens when the provider cannot deliver?</li>\n<li><strong>Data confidentiality and auditability</strong>, described as a serious problem.</li>\n<li><strong>Vendor lock-in</strong>: diversity of services, data organisation and user interfaces limits user mobility.</li>\n<li>A data transfer bottleneck, since many applications are data-intensive.</li>\n<li>Performance unpredictability, resource management, and security for sensitive applications such as healthcare.</li>\n</ul>\n","cloud-activities-what-a-provider-actually-operates":"<p>A cloud service involves four families of activity.</p>\n<ul>\n<li><strong>Service management and provisioning</strong>: virtualization, provisioning, operations and systems management, QoS management, billing, SLA management and backups.</li>\n<li><strong>Security management</strong>: identity and authentication, intrusion prevention and detection, cryptography, physical security, access control, audit and trails, firewalls.</li>\n<li><strong>Customer services</strong>: assistance and online help, subscriptions, business intelligence, reporting.</li>\n<li><strong>Integration services</strong>: data management and development.</li>\n</ul>\n","what-a-deployment-model-is":"<p>A <strong>cloud deployment model</strong> is a specific configuration of environment parameters such as the accessibility and proprietorship of the infrastructure and storage size.</p>\n<ul>\n<li>Deployment models define the type of access to the cloud &mdash; how the cloud is located.</li>\n<li>A cloud can have four types of access: public, private, hybrid and community.</li>\n<li>What separates them is not the hardware but who controls the infrastructure and where it sits.</li>\n<li>The same physical data centre can be public for one customer and private for another.</li>\n</ul>\n","the-four-models":"<p>Four deployment models, separated by who controls the infrastructure.</p>\n<ul>\n<li><strong>Public cloud</strong>: available to the general public or a large industry group, owned by the organisation selling the services.</li>\n<li><strong>Private cloud</strong>: operated solely for one organisation, with little technical difference from a public one; also called internal or corporate.</li>\n<li><strong>Community cloud</strong>: shared by several organisations with shared concerns, whose difference from the private model is the set of users.</li>\n<li><strong>Hybrid cloud</strong>: two or more clouds bound by standardised technology enabling data and application portability.</li>\n</ul>\n","the-comparison-table":"<p>Read down a column and the four models are four settings of one trade: control against convenience.</p>\n<ul>\n<li>The public cloud is cheapest and easiest to set up, giving up security, control and reliability.</li>\n<li>The private cloud is the opposite in every one of those rows and the most expensive model.</li>\n<li>The hybrid buys the elastic part from a public cloud while keeping the sensitive part in-house.</li>\n<li>The community cloud shares the cost, and is the one row that is not high &mdash; fixed capacity.</li>\n</ul>\n","advantages-disadvantages-and-use-cases-for-each":"<p>Each model's advantages carry their own disadvantages and suit a particular use case.</p>\n<ul>\n<li>Public: hassle-free management, high scalability and reduced cost, at the price of reliability and data privacy; for fluctuating demand.</li>\n<li>Private: bespoke, flexible, secure and reliable, at considerable expense; for mission-critical operations under one company's control.</li>\n<li>Community: cost reduction, improved security and collaboration, at a higher cost and with fixed capacity; for joint projects between organisations.</li>\n<li>Hybrid: sensitive workloads stay private while the rest bursts to the public cloud.</li>\n</ul>\n","ethical-issues-and-de-perimeterisation":"<p>Moving to the cloud relinquishes control to third-party services and stores data on multiple sites.</p>\n<ul>\n<li>The implications are unauthorized access, data corruption, and infrastructure failure and service unavailability.</li>\n<li><strong>De-perimeterisation</strong> is the removal of a boundary between an organisation and the outside world.</li>\n<li>Systems and data are then protected on multiple levels, using encryption, secure protocols, secure systems and data-level authentication, rather than the network boundary.</li>\n<li>Once the perimeter is gone, identity and access management and data-level security are the only controls left.</li>\n</ul>\n"},
  pastSummary: `<h2>Exam-facing summary</h2>
<table class="comparison-table">
<thead>
<tr><th>If the question says&hellip;</th><th>Give&hellip;</th></tr>
</thead>
<tbody>
<tr><td>Define cloud computing</td><td>The Wikipedia definition (ubiquitous access to shared pools of configurable resources, rapidly provisioned with minimal management effort, economies of scale like a public utility) and the Azure one (delivery of computing services over the Internet, charged by usage like gas or electricity).</td></tr>
<tr><td>Trace the history and evolution</td><td>Renting computing from the 1950s; grid computing (National Labs, early 1990s, scientific, non-interactive workloads) and utility computing (2005&ndash;06, IT companies, enterprise, charged for specific usage rather than a flat rate); the five technologies &mdash; distributed systems and peripherals, virtualization, Web 2.0, service orientation, utility computing; and Fig 5.1 with cloud computing in 2007.</td></tr>
<tr><td>What are the characteristics of cloud computing?</td><td>On-demand, scalable and elastic; resources metered with charging only for what is used; a shared pool of resources; Internet technology for scalable and elastic services; elasticity defined as dynamically and on-demand acquiring resources for a variable workload; cost-effectiveness through resource multiplexing; location-independent data storage; management by the provider through specialisation and centralisation.</td></tr>
<tr><td>Key features and benefits (4 marks)</td><td>Shared CPU, storage and bandwidth; higher utilisation because peaks are unsynchronised; aggregation for data-intensive applications and collaboration on shared data sets; no initial infrastructure investment and no maintenance or operation costs; pay-as-you-go; elasticity for large peak-to-average ratios; user convenience through virtualization. Close with why it succeeded: technology timing, economics, and a single administrative domain.</td></tr>
<tr><td>Differentiate IaaS and PaaS (2 marks)</td><td>The two sentences in the tip box above, plus "IaaS rents the machine, PaaS rents the runtime, SaaS rents the application", with EC2 and Google App Engine/Windows Azure.</td></tr>
<tr><td>Compare the four deployment models (8 marks)</td><td>The five moves listed with the use cases for each: definition of a deployment model, the four definitions, the 7&times;4 comparison table, advantages and disadvantages, one use case each.</td></tr>
<tr><td>What challenges does cloud computing face?</td><td>Availability of service, data confidentiality and auditability, diversity of services and vendor lock-in, data transfer bottleneck, performance unpredictability from resource sharing (with virtualization, performance isolation and QoS, and elasticity as the questions), resource management, and security for sensitive applications such as healthcare.</td></tr>
<tr><td>Discuss ethical issues in cloud computing</td><td>Control relinquished to third parties, data on multiple sites under several organisations, services interoperating across the network &mdash; with the implications of unauthorized access, data corruption and service unavailability; then de-perimeterisation and its replacement controls.</td></tr>
</tbody>
</table>


`,

  slides: `
<h2>The teacher's slides for this unit</h2>
<p class="ref-intro">These are the pictures that came with this unit &mdash; the class deck, the reference notes and the pages handed out with them &mdash; collected here so that the notes above read as writing rather than as a pile of screenshots. Each group is headed by the section of the notes its pictures belong to, in that order, and names the file and the slides they came from. The diagrams the notes themselves need are drawn in the notes.</p>

<h3>The basic reasoning and the two early models</h3>

<p class="ref-meta">From <em>Ref_CloudComptng.pptx</em>, slide 17.</p>

<!-- dcc-fig:ch5/ref-cloudcomptng-s17-121.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ref-cloudcomptng-s17-121.webp" alt="In a basic grid computing system, every computer can access the resources of every other computer belonging to the network" width="400" height="400" loading="lazy" decoding="async">
<figcaption>In a basic grid computing system, every computer can access the resources of every other computer belonging to the network</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>The five technologies, and the timeline</h3>

<p class="ref-meta">From <em>Ch_5_Int_to_CloudComputing.ppt</em>, slide 5.</p>

<!-- dcc-fig:ch5/ch-5-int-to-cloudcomputing-s05-161.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ch-5-int-to-cloudcomputing-s05-161.webp" alt="Illustration for The five technologies, and the timeline" width="1264" height="867" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>The three axes of cloud computing</h3>

<p class="ref-meta">From <em>Ch_5_Int_to_CloudComputing.ppt</em>, slide 26.</p>

<!-- dcc-fig:ch5/ch-5-int-to-cloudcomputing-s26-165.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ch-5-int-to-cloudcomputing-s26-165.webp" alt="The Three delivery/Service models of Cloud Computing" width="550" height="383" loading="lazy" decoding="async">
<figcaption>The Three delivery/Service models of Cloud Computing</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>The benefits</h3>

<p class="ref-meta">From <em>Ch_5_Int_to_CloudComputing.ppt</em>, slide 32.</p>

<!-- dcc-fig:ch5/ch-5-int-to-cloudcomputing-s32-166.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ch-5-int-to-cloudcomputing-s32-166.webp" alt="The benefits of cloud computing" width="964" height="830" loading="lazy" decoding="async">
<figcaption>The benefits of cloud computing</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>5.3 Cloud service models: IaaS, PaaS, SaaS</h3>

<p class="ref-meta">From <em>Ch_5_Int_to_CloudComputing.ppt</em>, <em>Ref_CloudComptng.pptx</em>, slides 11, 22 and 52.</p>

<!-- dcc-fig:ch5/ch-5-int-to-cloudcomputing-s22-164.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ch-5-int-to-cloudcomputing-s22-164.webp" alt="Cloud Delivery/Service Models" width="348" height="322" loading="lazy" decoding="async">
<figcaption>Cloud Delivery/Service Models</figcaption>
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch5/ref-cloudcomptng-s11-119.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ref-cloudcomptng-s11-119.webp" alt="Illustration for 5.3 Cloud service (delivery) models" width="560" height="465" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch5/ref-cloudcomptng-s52-124.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ref-cloudcomptng-s52-124.webp" alt="Illustration for 5.3 Cloud service (delivery) models" width="1280" height="424" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>What a deployment model is</h3>

<p class="ref-meta">From <em>Ch_5_Int_to_CloudComputing.ppt</em>, <em>Ref_CloudComptng.pptx</em>, slides 8, 12, 15, 21 and 39.</p>

<!-- dcc-fig:ch5/ch-5-int-to-cloudcomputing-s15-162.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ch-5-int-to-cloudcomputing-s15-162.webp" alt="Illustration for What a deployment model is" width="1210" height="1316" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch5/ref-cloudcomptng-s08-118.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ref-cloudcomptng-s08-118.webp" alt="Cloud infrastructure consists of servers, storage devices, network, cloud management software, deployment…" width="560" height="175" loading="lazy" decoding="async">
<figcaption>Cloud infrastructure consists of servers, storage devices, network, cloud management software, deployment…</figcaption>
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch5/ref-cloudcomptng-s21-122.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ref-cloudcomptng-s21-122.webp" alt="Illustration for What a deployment model is" width="468" height="271" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch5/ref-cloudcomptng-s39-123.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ref-cloudcomptng-s39-123.webp" alt="Illustration for What a deployment model is" width="809" height="518" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch5/ref-cloudcomptng-s12-120.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ref-cloudcomptng-s12-120.webp" alt="Infrastructural Constraints: Fundamental constraints that cloud infrastructure should implement are shown in the following diagram" width="400" height="264" loading="lazy" decoding="async">
<figcaption>Infrastructural Constraints: Fundamental constraints that cloud infrastructure should implement are shown in the following diagram</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>Ethical issues and de-perimeterisation</h3>

<p class="ref-meta">From <em>Ch_5_Int_to_CloudComputing.ppt</em>, slide 18.</p>

<!-- dcc-fig:ch5/ch-5-int-to-cloudcomputing-s18-163.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ch-5-int-to-cloudcomputing-s18-163.webp" alt="Illustration for Ethical issues and de-perimeterisation" width="1210" height="1303" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->
`,
  quiz: [
    {
      q: 'Which two early computing models preceded cloud computing?',
      options: [
        'Grid computing (scientific, National Labs, early 1990s) and utility computing (enterprise, IT companies, 2005-2006)',
        'Mainframe computing and thin-client computing',
        'Serverless computing and container computing',
        'Peer-to-peer computing and grid computing only'
      ],
      answer: 0,
      explanation: 'Grid computing was initiated by the National Labs in the early 1990s and targeted scientific computing with non-interactive workloads; utility computing was initiated in 2005-2006 by IT companies for enterprise computing and charges for specific usage rather than a flat rate. Five technologies made cloud computing possible: distributed systems and their peripherals, virtualization, Web 2.0, service orientation and utility computing.'
    },
    {
      q: 'Which of these is a defining attribute of cloud computing?',
      options: [
        'Manual provisioning by the customer',
        'Utility computing with pay-per-usage, accessible via the Internet, with elasticity',
        'Fixed, contract-locked capacity',
        'On-premises hardware ownership'
      ],
      answer: 1,
      explanation: 'The map has three rows: delivery models (SaaS, PaaS, IaaS), deployment models (public, private, community, hybrid) and defining attributes — utility computing / pay-per-usage, accessible via the Internet, and elasticity.'
    },
    {
      q: 'What is the difference between scalability and elasticity?',
      options: [
        'They are the same thing',
        'Scalability is the ability to handle growth; elasticity is dynamically and on-demand acquiring resources to support a variable workload',
        'Scalability applies to storage only and elasticity to compute only',
        'Elasticity means the cost is fixed and scalability means it is variable'
      ],
      answer: 1,
      explanation: 'The distinction to keep clear: elastic computing refers to the ability to dynamically and on-demand acquire computing resources and support a variable workload — which is what makes workloads with large peak-to-average ratios economic, because resources can also be released.'
    },
    {
      q: 'Why does resource multiplexing make cloud computing cheaper?',
      options: [
        'Because hardware is bought in bulk at a discount',
        'Because when multiple applications share a system their peak demands are not synchronised, so utilisation is higher',
        'Because users are charged a flat rate regardless of use',
        'Because the provider uses older hardware'
      ],
      answer: 1,
      explanation: 'When multiple applications share a system, their peak demands for resources are not synchronised, so multiplexing leads to higher resource utilisation. Lower costs for the provider are then passed to the users.'
    },
    {
      q: 'A single cloud consists of mostly homogeneous resources in a single administrative domain. Why is this a reason for its success?',
      options: [
        'Because homogeneous hardware is faster',
        'Because security, resource management, fault tolerance and quality of service are less challenging than in a heterogeneous environment with resources in multiple administrative domains',
        'Because it prevents vendor lock-in',
        'Because it removes the need for virtualization'
      ],
      answer: 1,
      explanation: 'That is the infrastructures-management reason, alongside the technology-timing reason (exploiting advances in software, networking, storage and processors) and the economic one (adoption by industry, finance and government).'
    },
    {
      q: 'In which service model does the customer control the operating systems, storage and deployed applications?',
      options: [
        'SaaS',
        'PaaS',
        'IaaS',
        'None — the provider controls all of them in every model'
      ],
      answer: 2,
      explanation: 'IaaS lets the user deploy and run arbitrary software, including operating systems and applications. The user does not manage the underlying cloud infrastructure but controls operating systems, storage, deployed applications and possibly limited networking components such as host firewalls. Amazon EC2 is the example.'
    },
    {
      q: 'A PaaS deployment is NOT particularly useful when:',
      options: [
        'The application is a web application',
        'The application must be portable, proprietary programming languages are used, or hardware and software must be customised for performance',
        'The application uses a database',
        'The team is small'
      ],
      answer: 1,
      explanation: 'Those three are the stated conditions. PaaS gives the customer control over the deployed application and possibly application hosting environment configurations, but not the network, servers, operating systems or storage — which is exactly what portability and customisation require.'
    },
    {
      q: 'Which pair correctly matches a service model with its example?',
      options: [
        'IaaS — Gmail; SaaS — Amazon EC2',
        'IaaS — Amazon EC2; PaaS — Google App Engine and Windows Azure; SaaS — Gmail and Salesforce',
        'PaaS — Gmail; SaaS — Amazon EC2',
        'IaaS — Salesforce; PaaS — Amazon EC2'
      ],
      answer: 1,
      explanation: 'The examples: IaaS — Amazon EC2; PaaS — Google App Engine and Windows Azure; SaaS — Gmail and Salesforce. SaaS supplies applications; the user controls neither the infrastructure nor individual application capabilities, and it suits neither real-time applications nor data that must not be hosted externally.'
    },
    {
      q: 'Which cloud deployment model is owned by the organisation selling the services and made available to the general public?',
      options: [
        'Private cloud',
        'Community cloud',
        'Public cloud',
        'Hybrid cloud'
      ],
      answer: 2,
      explanation: 'The public cloud\'s infrastructure is made available to the general public or a large industry group and owned by the organisation selling cloud services; customers have no control over the location of the infrastructure. It is the first choice for businesses with low privacy concerns.'
    },
    {
      q: 'What is the only difference between a community cloud and a private cloud?',
      options: [
        'The technology used',
        'The set of users — several organisations with similar backgrounds share the infrastructure instead of one company',
        'The deployment location',
        'The billing model'
      ],
      answer: 1,
      explanation: 'A community deployment model largely resembles the private one; the difference is that several organisations with similar backgrounds share the infrastructure and resources. Members generally share similar privacy, performance and security issues, and it is managed internally or by a third-party vendor.'
    },
    {
      q: 'What defines a hybrid cloud?',
      options: [
        'A cloud that uses both physical and virtual servers',
        'A composition of two or more clouds (public, private or community) as unique entities, bound by standardised technology enabling data and application portability',
        'A private cloud with a backup site',
        'Any cloud with more than one tenant'
      ],
      answer: 1,
      explanation: 'The binding condition matters: standardised technology enabling data and application portability. A company can then balance load by putting mission-critical workloads on a secure private cloud and less sensitive ones on a public one, which safeguards strategically important assets cost- and resource-effectively.'
    },
    {
      q: 'Which model has "little to none" data control and is the cheapest?',
      options: [
        'Private',
        'Community',
        'Public',
        'Hybrid'
      ],
      answer: 2,
      explanation: 'The comparison table: public has little-to-none data control, low data security and privacy, low reliability, high scalability and flexibility, and is the cheapest, with no demand for in-house hardware. Private is the most expensive and the most secure; community shares cost but has fixed capacity; hybrid is cheaper than private but costlier than public.'
    },
    {
      q: 'Which is a disadvantage of the public cloud?',
      options: [
        'It requires extensive staff training',
        'Users are deprived of knowing where their information is kept and who has access to it',
        'It cannot scale beyond a fixed capacity',
        'It requires in-house hardware'
      ],
      answer: 1,
      explanation: 'The three public-cloud disadvantages are compromised reliability (citing the 2016 Salesforce CRM disruption), data security and privacy concerns — since although access to data is easy, users do not know where their information is kept or who can access it — and the lack of a bespoke service, because providers offer only standardised options.'
    },
    {
      q: 'What is vendor lock-in?',
      options: [
        'The provider refusing to release your data after payment stops',
        'The diversity of services, data organisation and user interfaces at different providers limiting user mobility, so moving provider is hard',
        'A long-term contract requirement',
        'Proprietary hardware in the data centre'
      ],
      answer: 1,
      explanation: 'It is listed among the challenges: diversity of services, data organisation and user interfaces available at different service providers limits user mobility — once a customer is hooked to one provider, it is hard to move to another.'
    },
    {
      q: 'What does de-perimeterisation mean in the cloud context?',
      options: [
        'Removing the cloud provider\'s firewall',
        'Removing the boundary between an organisation and the outside world, protecting systems and data with encryption, secure protocols and data-level authentication instead of relying on the network boundary',
        'Encrypting only the network traffic',
        'Moving all data back on premises'
      ],
      answer: 1,
      explanation: 'Systems span the boundaries of multiple organisations, and the complex structure of cloud services makes it hard to determine who is responsible when something goes wrong. De-perimeterisation replaces the network perimeter with layered controls at the data level, and successful implementation means the outer security boundary was removed.'
    },
    {
      q: 'In the public cloud, what does the customer pay for?',
      options: [
        'A flat monthly rate regardless of use',
        'Only the resources used, metered by usage',
        'The hardware, amortised over time',
        'Only the software licences'
      ],
      answer: 1,
      explanation: 'Resources are metered and users are charged only for the resources used — the utility analogy the Azure definition makes explicit ("similar to how you are billed for gas or electricity at home"). Separate from that, a public cloud may use a shared cost model for all users or a licensing policy such as pay per user.'
    }
  ],

  past: [
    {
      year: '2025 (expected)',
      marks: '5',
      repeats: 1,
      q: 'Explain the evolution of cloud computing from Mainframe to Cloud.',
      occ: [
        { year: '2025 (expected)', marks: '5', q: 'Explain the evolution of cloud computing from Mainframe to Cloud.' }
      ],
      answer: `
<h4>Model answer &mdash; 5 marks</h4>
<p>The marks are in the sequence and in what each step was fundamentally about:</p>
<ul>
<li><strong>Mainframe (1960s&ndash;70s)</strong> &mdash; one large central machine, dumb terminals,
time-sharing. The computing power is centralised and the client is a screen. The idea of
<em>sharing a pool of computing power among many users</em> starts here.</li>
<li><strong>Client&ndash;server and the PC (1980s)</strong> &mdash; power moves outward. Each user
has a machine, and applications and data sit on servers reached over a LAN. This buys
individual control at the cost of central efficiency.</li>
<li><strong>Grid and cluster computing (1990s)</strong> &mdash; many machines are made to look
like one, first within a cluster, then across institutions in a grid. Job scheduling across
owned resources becomes the problem, and it works but only for batch work between parties who
agree to share.</li>
<li><strong>Utility computing and virtualisation (early 2000s)</strong> &mdash; the question
shifts from <em>can we pool</em> to <em>can we sell it</em>. Virtualisation decouples the
machine from the workload, and a provider can now rent a slice of a machine by the hour.</li>
<li><strong>Cloud (2006 onward)</strong> &mdash; AWS EC2 opens the model to anyone with a card:
elastic, self-service, measured, pay-per-use. The technical capacity already existed by 2000.
What the cloud adds is the commercial and self-service interface on top of it.</li>
</ul>
<div class="concept-box tip">
<h4>Marking this one</h4>
<p>Predicted &mdash; from the previous site's “2025 Exam / Expected” set, 5 marks. Five
stages, five marks, one line each: this is deliberately a breadth question and time spent on
any one stage is time not spent on the others. The line that lifts it is the last one &mdash;
that the cloud's novelty is the interface and the billing, not the hardware.</p>
</div>
`
    },
    {
      year: '2025 (expected)',
      marks: '6',
      repeats: 1,
      q: 'Compare IaaS, PaaS, and SaaS with suitable examples.',
      occ: [
        { year: '2025 (expected)', marks: '6', q: 'Compare IaaS, PaaS, and SaaS with suitable examples.' }
      ],
      answer: `
<h4>Model answer &mdash; 6 marks</h4>
<p>The three service models differ in one thing, and it is the only thing worth leading with:
<strong>how much of the stack the provider manages and how much the customer manages</strong>.
The provider always manages the physical hardware; what moves as you go up is the boundary.</p>
<table class="comparison-table">
<tr><th>Model</th><th>The provider manages</th><th>You manage</th><th>Examples</th></tr>
<tr><td><strong>IaaS</strong></td><td>Virtualisation, servers, storage, networking</td><td>OS, runtime, middleware, applications, data</td><td>AWS EC2, Google Compute Engine, Azure Virtual Machines</td></tr>
<tr><td><strong>PaaS</strong></td><td>IaaS plus OS, runtime and middleware</td><td>Applications and data only</td><td>Google App Engine, Heroku, Azure App Service</td></tr>
<tr><td><strong>SaaS</strong></td><td>Everything, including the application</td><td>Your data and your users' configuration</td><td>Gmail, Google Docs, Salesforce, Microsoft 365</td></tr>
</table>
<p>The consequence to state explicitly, because it is where the marks are: control falls as you
climb and convenience rises. IaaS gives the most control and the most operational work; SaaS
gives the least of both. That is why a company migrating with a legacy operating system it
cannot change chooses IaaS, while one that wants a web application deployed without an
operations team chooses PaaS.</p>
<div class="concept-box tip">
<h4>Marking this one</h4>
<p>Predicted, not a past paper &mdash; from the previous site's “2025 Exam / Expected”
set. Six marks for three models: the table is two thirds of the answer and the sentence about
control moving with convenience is the rest. An answer that describes each model separately
without comparing them answers a different question.</p>
</div>
`
    },
    {
      year: '2025 (expected)',
      marks: '8',
      repeats: 1,
      q: 'Explain the NIST definition of cloud computing and its five essential characteristics.',
      occ: [
        { year: '2025 (expected)', marks: '8', q: 'Explain the NIST definition of cloud computing and its five essential characteristics.' }
      ],
      answer: `
<h4>Model answer &mdash; 8 marks</h4>
<p><strong>The NIST definition.</strong> Cloud computing is a model for enabling ubiquitous,
convenient, on-demand network access to a shared pool of configurable computing resources
(networks, servers, storage, applications and services) that can be rapidly provisioned and
released with minimal management effort or service-provider interaction. Four words in that
sentence carry the marks: <em>on-demand</em>, <em>shared pool</em>, <em>rapidly provisioned</em>
and <em>minimal provider interaction</em>.</p>
<p>The definition is stated as <strong>five essential characteristics</strong>, three service
models and four deployment models. The five:</p>
<ol>
<li><strong>On-demand self-service</strong> &mdash; a consumer provisions computing capability
unilaterally and automatically, without human interaction with the provider. This is the
property that separates a cloud from a hosting company.</li>
<li><strong>Broad network access</strong> &mdash; the capabilities are available over the network
through standard mechanisms, so thin and thick clients alike can reach them.</li>
<li><strong>Resource pooling</strong> &mdash; the provider's resources are pooled to serve
multiple consumers using a <em>multi-tenant</em> model, with physical and virtual resources
assigned and reassigned dynamically. The customer generally has no knowledge of, or control
over, the exact location of the resources.</li>
<li><strong>Rapid elasticity</strong> &mdash; capabilities can be elastically provisioned and
released, so they appear unlimited to the consumer and can be bought up or down at any time.</li>
<li><strong>Measured service</strong> &mdash; resource use is monitored, controlled and reported,
providing transparency for both provider and consumer. This is what makes <em>pay-as-you-go</em>
possible.</li>
</ol>
<div class="concept-box tip">
<h4>Marking this one</h4>
<p>This is a predicted question, not a question from a paper &mdash; it comes from the previous
site's “Teacher Notes / 2025 Expected” set, so treat it as a drill rather than
evidence. It is worth answering anyway, because the five characteristics are the part of the
syllabus that every cloud question is marked against. Five named characteristics with one
sentence each is the structure; the definition itself is the opening mark, and quoting its
distinctive phrases is how you show it is the NIST wording rather than a paraphrase.</p>
</div>
`
    },
    {
      year: 'Model 2025',
      marks: '2',
      repeats: 1,
      q: 'What is the difference between IaaS and PaaS?',
      occ: [
        { year: 'Model 2025', marks: '2', q: 'What is the difference between IaaS and PaaS?' }
      ],
      answer: `
<h4>Model answer &mdash; 2 marks</h4>
<p><strong>IaaS</strong> (Infrastructure as a Service) provides the <strong>infrastructure itself</strong> &mdash; <strong>compute resources, CPU, virtual machines, servers, storage, load balancers and network</strong>. The user <strong>can deploy and run arbitrary software, which can include operating systems and applications</strong>: the user does not manage or control the underlying cloud infrastructure, but <strong>has control over operating systems, storage, deployed applications and possibly limited control of some networking components such as host firewalls</strong>. Services offered include server hosting, storage, computing hardware, operating systems, virtual instances, load balancing, Internet access and bandwidth provisioning. <strong>Example: Amazon EC2.</strong></p>

<p><strong>PaaS</strong> (Platform as a Service) provides a <strong>platform</strong>: it allows a cloud user <strong>to deploy consumer-created or acquired applications using programming languages and tools supported by the service provider</strong>. The user <strong>has control over the deployed applications and possibly application hosting environment configurations, but does not manage or control the underlying cloud infrastructure, including network, servers, operating systems or storage</strong>. It is <strong>not particularly useful when the application must be portable, when proprietary programming languages are used, or when the hardware and software must be customised to improve performance</strong>. <strong>Examples: Google App Engine, Windows Azure.</strong></p>

<p><strong>In one line:</strong> IaaS rents you the <em>machine</em> (you still manage the OS and everything above it); PaaS rents you the <em>runtime and middleware</em> (you manage only the application). Both are below SaaS, which rents you the finished application.</p>

<div class="concept-box tip">
<h4>Where this came from</h4>
<p>Group A, question 2 of the <em>Model Question 2025</em> &mdash; Group A is 2 marks per question, so this is a definition-plus-distinction answer, not an essay. Naming the layer boundary (operating system for IaaS, runtime for PaaS) and one example each is what earns both marks.</p>
</div>`
    },
    {
      year: 'Model 2025',
      marks: '4',
      repeats: 1,
      q: 'What are the key features and benefits of cloud computing?',
      occ: [
        { year: 'Model 2025', marks: '4', q: 'What are the key features and benefits of cloud computing?' }
      ],
      answer: `
<h4>Model answer &mdash; 4 marks</h4>
<p><strong>Key features.</strong> Cloud computing offers <strong>on-demand, scalable and elastic computing and storage services</strong>, with resources that are <strong>metered and charged only for what is used</strong>. Its defining attributes are <strong>utility computing with pay-per-usage, accessibility via the Internet, and elasticity</strong>. Four characteristics make it work:</p>
<ul>
<li><strong>A shared pool of resources</strong> with provider-side resource management.</li>
<li><strong>Internet technology</strong> delivering scalable and elastic services &mdash; where <strong>elastic computing is the ability to dynamically and on-demand acquire computing resources and support a variable workload</strong>.</li>
<li><strong>Metering</strong>, so users are charged according to the resources used.</li>
<li><strong>Cost-effectiveness through resource multiplexing</strong>, with the provider's lower costs passed on to users.</li>
</ul>
<p>Two further characteristics: <strong>data storage is location-independent</strong> &mdash; the data may sit closer to where it is used and appears to users as stored in a location-independent manner, which can increase reliability and security and lower communication costs &mdash; and <strong>maintenance and security are operated by the service providers</strong>, who are more efficient because of specialisation and centralisation.</p>

<p><strong>Benefits.</strong></p>
<ul>
<li><strong>Shared resources</strong> &mdash; CPU cycles, storage and network bandwidth are shared.</li>
<li><strong>Higher resource utilisation</strong> &mdash; when multiple applications share a system, their peak demands are not synchronised, so multiplexing raises utilisation.</li>
<li><strong>Aggregation and collaboration</strong> &mdash; resources can be aggregated to support data-intensive applications, and data sharing facilitates collaborative activities across geographically scattered groups.</li>
<li><strong>No capital investment</strong> &mdash; it eliminates the initial cost of a private infrastructure and its maintenance and operation costs.</li>
<li><strong>Pay-as-you-go cost reduction</strong> &mdash; concentration of resources makes paying for computing by usage possible.</li>
<li><strong>Elasticity</strong> &mdash; the ability to accommodate workloads with very large peak-to-average ratios.</li>
<li><strong>User convenience</strong> &mdash; virtualization lets users work in familiar environments rather than idiosyncratic ones.</li>
</ul>
<p><em>Optional closing line:</em> cloud computing succeeded where earlier paradigms did not because it uses a single administrative domain, making security, resource management, fault tolerance and QoS less challenging than in a heterogeneous environment with resources in multiple administrative domains.</p>

<div class="concept-box tip">
<h4>Where this came from</h4>
<p>Group B, question 10 of the <em>Model Question 2025</em>, worth 4 marks. The question asks for <strong>features and benefits</strong> &mdash; two halves &mdash; so head the answer with two sections. Ten short items beat three long paragraphs here, because the marking scheme is a list.</p>
</div>`
    },
    {
      year: 'Model 2025',
      marks: '8',
      repeats: 1,
      q: 'Compare and contrast the public, private, hybrid, and community cloud deployment models with suitable use cases.',
      occ: [
        { year: 'Model 2025', marks: '8', q: 'Compare and contrast the public, private, hybrid, and community cloud deployment models with suitable use cases.' }
      ],
      answer: `
<h4>Model answer &mdash; 8 marks</h4>

<p><strong>1. What a deployment model is.</strong> A <strong>cloud deployment model is a specific configuration of environment parameters such as the accessibility and proprietorship of the deployment infrastructure and storage size</strong> &mdash; that is, deployment types vary according to <strong>who controls the infrastructure and where it is located</strong>. A cloud can have any of four types of access: <strong>public, private, hybrid and community</strong>.</p>

<p><strong>2. The four models.</strong></p>
<ul>
<li><strong>Public cloud</strong> &mdash; the infrastructure is <strong>made available to the general public or a large industry group and is owned by the organisation selling cloud services</strong>. Customers have <strong>no control over the location of the infrastructure</strong>, and it uses a shared cost model or a licensing policy such as pay per user.</li>
<li><strong>Private cloud</strong> &mdash; the infrastructure is <strong>operated solely for one organisation</strong>. Technically it resembles a public cloud closely; the difference is ownership, which is why it is also called an <strong>internal or corporate</strong> model. The servers may be hosted externally or on the owner's premises, but are <strong>maintained on a designated private network using hardware and software intended only for the owner</strong>, and <strong>a clearly defined set of people has access</strong>.</li>
<li><strong>Community cloud</strong> &mdash; the infrastructure is <strong>shared by several organisations that support a community with shared concerns</strong>. It resembles the private model except in the set of users: <strong>organisations with similar backgrounds share the infrastructure and resources</strong>, generally sharing similar privacy, performance and security issues, and it is managed internally or by a third party.</li>
<li><strong>Hybrid cloud</strong> &mdash; a <strong>composition of two or more clouds (public, private or community) as unique entities, bound by standardised technology that enables data and application portability</strong>. It lets a company mix the facets of the other three that suit it.</li>
</ul>

<p><strong>3. Comparison (the table to reproduce).</strong></p>
<table class="comparison-table">
<thead>
<tr><th></th><th>Public</th><th>Private</th><th>Community</th><th>Hybrid</th></tr>
</thead>
<tbody>
<tr><td>Ease of setup and use</td><td><strong>Easy</strong></td><td>Requires IT proficiency</td><td>Requires IT proficiency</td><td>Requires IT proficiency</td></tr>
<tr><td>Data security and privacy</td><td>Low</td><td><strong>High</strong></td><td>Comparatively high</td><td><strong>High</strong></td></tr>
<tr><td>Data control</td><td>Little to none</td><td><strong>High</strong></td><td>Comparatively high</td><td>Comparatively high</td></tr>
<tr><td>Reliability</td><td>Low</td><td><strong>High</strong></td><td>Comparatively high</td><td><strong>High</strong></td></tr>
<tr><td>Scalability and flexibility</td><td><strong>High</strong></td><td><strong>High</strong></td><td><strong>Fixed capacity</strong></td><td><strong>High</strong></td></tr>
<tr><td>Cost-effectiveness</td><td><strong>Cheapest</strong></td><td><strong>Most expensive</strong></td><td>Cost shared among members</td><td>Cheaper than private, costlier than public</td></tr>
<tr><td>Demand for in-house hardware</td><td>No</td><td>Depends</td><td>Depends</td><td>Depends</td></tr>
</tbody>
</table>

<p><strong>4. Advantages, disadvantages and use cases.</strong></p>
<ul>
<li><strong>Public</strong> &mdash; <em>Advantages:</em> hassle-free infrastructure management, high scalability, reduced costs (pay only for what is used, no hardware or software investment), 24/7 uptime. <em>Disadvantages:</em> compromised reliability (the deck cites the 2016 Salesforce CRM disruption), data security and privacy concerns because <strong>users do not know where their information is kept or who has access</strong>, and the lack of a bespoke service since providers offer only standardised options. <em>Use case:</em> <strong>organisations with growing and fluctuating demands</strong> &mdash; <strong>web applications, webmail and storage of non-sensitive data</strong>; it is <strong>the first choice for businesses with low privacy concerns</strong> (Amazon EC2, Microsoft Azure, Google App Engine, IBM Cloud, Salesforce Heroku).</li>
<li><strong>Private</strong> &mdash; <em>Advantages:</em> all resulting from autonomy &mdash; bespoke and flexible development, high scalability, and <strong>high security, privacy and reliability</strong> since only authorised persons can access resources. <em>Disadvantage:</em> <strong>cost</strong>, requiring considerable expense on hardware, software and staff training, which makes it unsuitable for small companies. <em>Use case:</em> <strong>safeguarding mission-critical operations</strong> and businesses with <strong>constantly changing requirements</strong> that need customisation &mdash; and, as the deck notes, a growing number of large corporations now choose a closed private cloud to minimise data-security issues after recent breaches.</li>
<li><strong>Community</strong> &mdash; <em>Advantages:</em> <strong>cost reduction</strong> (shared by members), <strong>improved security, privacy and reliability</strong>, and <strong>ease of data sharing and collaboration</strong>; where members have uniform security, privacy and performance requirements, this multi-tenant data centre raises efficiency and the centralised cloud eases project development and management. <em>Disadvantages:</em> <strong>high cost compared to the public model</strong> and <strong>sharing of fixed storage and bandwidth capacity</strong>. <em>Use case:</em> <strong>joint projects among organisations with a shared concern</strong> &mdash; <strong>banks</strong>, <strong>government organisations</strong> or commercial enterprises.</li>
<li><strong>Hybrid</strong> &mdash; <em>Advantages:</em> <strong>improved security and privacy</strong>, <strong>enhanced scalability and flexibility</strong>, a <strong>reasonable price</strong>, and <strong>data and application portability</strong>. <em>Disadvantages:</em> it inherits the other models' overheads (IT proficiency, ongoing costs, vendor lock-in) and depends on standardised technology to allow portability. <em>Use case:</em> <strong>balancing load by locating mission-critical workloads on a secure private cloud and deploying less sensitive ones to a public one</strong>, which safeguards strategically important assets cost- and resource-effectively &mdash; for example a bank keeping customer records private while serving its public site from a public cloud.</li>
</ul>

<p><strong>5. Conclusion.</strong> The four models are not ranked; they trade <strong>control, security and cost</strong> against each other. The public cloud is cheapest and easiest but weakest on data control; the private cloud is the opposite; the community cloud shares the cost of a private-style deployment among organisations with a common interest, at the price of fixed capacity; and the hybrid cloud exists to place each workload where its requirements are best met.</p>

<div class="concept-box tip">
<h4>Where this came from</h4>
<p>Group C, question 13 of the <em>Model Question 2025</em>, worth 8 marks. The question says <strong>compare and contrast</strong> and <strong>with suitable use cases</strong> &mdash; three things are being asked for: the definitions, the comparison table, and a use case per model. Draw the table (it is seven comparisons in a small space) and finish with the three use cases named as kinds of organisation, not products.</p>
</div>`
    }
  ]
};
