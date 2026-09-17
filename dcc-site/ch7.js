/* Chapter 7 — Cloud Platforms and Technologies.

   Syllabus unit 7: 4 hours, 6 marks. Sub-topics 7.1 Overview of AWS, Microsoft
   Azure and Google Cloud, 7.2 Storage services (S3, Blob, etc.), 7.3 Compute
   services (EC2, Lambda, GCE).

   Sourcing note, because it differs from the rest of this portal. The lecture
   folder contains NO dedicated deck for this unit — there is no "Chapter 7"
   file among the 24 sources read into `_source/dcc/`. Everything here is
   therefore drawn from:

     * the Chapter 5 and Chapter 6 decks, which name the platforms and the
       service models (Amazon EC2 on Xen, Google App Engine, Windows Azure,
       IBM Blue Cloud, VM templates)
     * `lecture_notes_all_chapterwise_ref_cloudcomptng.txt` — the 114-slide
       reference deck on cloud computing, which supplies the IaaS service list,
       the top-provider list, the IaaS advantages and disadvantages, the
       XaaS family and the pizza analogy
     * `books_all_ref_book1_distributed_and_cloud_computing_kaihwang.txt` —
       Kai Hwang's *Distributed and Cloud Computing*, the course's first
       reference, which covers EC2, S3, EBS and SimpleDB, Eucalyptus and the
       virtual-cluster material
     * `books_all_ref_book2_cloudcomputingtheoryandpractice_p0001-0200.txt` —
       the Amazon chapter of Buyya's *Cloud Computing: Theory and Practice*,
       which supplies the EC2 instance lifecycle (launch, start, stop, reboot,
       terminate), the private, public and elastic IP behaviour, the three EC2
       pricing models, and S3's per-object metadata and object size range
     * the syllabus list itself: 7.1 Overview of AWS, Microsoft Azure and Google
       Cloud; 7.2 Storage services (S3, Blob, etc.); 7.3 Compute services
       (EC2, Lambda, GCE)

   Where a platform fact is not in those sources it is stated as the vendor's
   own published behaviour rather than as the teacher's wording, so the
   sourcing stays visible. If a Chapter 7 deck exists, uploading it will let
   this page be rewritten from class material. */

window.CHAPTERS = window.CHAPTERS || {};
window.CHAPTERS[7] = {
  learn: `

<h2>Unit 7 &mdash; Cloud Platforms and Technologies</h2>
<p class="unit-meta">Syllabus: 4 hours &middot; 6 marks &middot; sub-topics 7.1&ndash;7.3</p>

<h2>7.1 Overview of AWS, Microsoft Azure, and Google Cloud</h2>

<h3>What a cloud platform is</h3>
<p>A <strong>cloud provider</strong> is a company offering computing services over the Internet and charging for them based on usage. The platform is the whole of what that provider offers &mdash; the three delivery models from 5.3 all in one catalogue.</p>

<p>The model is a market: the third layer of the cloud service stack is IaaS, from Amazon, Windows Azure and Rackspace among others, and the middle layer is PaaS, from Google, Salesforce.com and Facebook among others. The same set appears from the service-model side &mdash; Amazon EC2 for IaaS, Google App Engine and Windows Azure for PaaS, Gmail and Salesforce for SaaS &mdash; and the public-cloud examples add IBM Cloud, Salesforce Heroku, Microsoft Azure and Google App Engine.</p>
<p>Every major platform is therefore best understood as <strong>the same three-layer catalogue</strong>, with the same three questions to ask of any of it. <em>What is rented</em> (IaaS, PaaS or SaaS), <em>where is it</em> (region and availability zone), and <em>how is it billed</em> (per hour, per second, per invocation, per gigabyte).</p>
<h3>The three platforms</h3>
<table class="comparison-table">
<thead>
<tr><th></th><th>Amazon Web Services (AWS)</th><th>Microsoft Azure</th><th>Google Cloud</th></tr>
</thead>
<tbody>
<tr><td><strong>Position</strong></td><td>The first mover and the largest catalogue.<span class="muted"> Amazon EC2 is the canonical IaaS example: EC2 uses Xen as its virtual machine monitor, and the same VMM is used in IBM's Blue Cloud.</span></td><td>Windows Azure is the other PaaS example.<span class="muted"> Microsoft also applies virtualization in its Azure cloud platform.</span></td><td>Google App Engine is the PaaS example,<span class="muted"> and the public-cloud list names Google App Engine among the popular providers.</span></td></tr>
<tr><td><strong>How it began</strong></td><td>As an IaaS platform: rent a virtual machine by the hour. EC2 is a web service that provides elastic computing power in a cloud, and it permits customers to create VMs and manage user accounts over the time of their use.</td><td>As a managed application platform and then expanded downwards into virtual machines and upwards into SaaS (Microsoft 365) &mdash; which is why the same platform appears as both a PaaS and an IaaS example in the course material.</td><td>As a managed application platform (App Engine), then expanded downwards into virtual machines and Kubernetes &mdash; the reverse of AWS's direction.</td></tr>
<tr><td><strong>Storage service</strong></td><td><strong>Amazon S3</strong> (object storage), with EBS (Elastic Block Store) and SimpleDB named alongside it.</td><td><strong>Azure Blob Storage</strong> for objects, with Azure Files and managed disks for file and block storage.</td><td><strong>Cloud Storage</strong> for objects, with Persistent Disk for block storage.</td></tr>
<tr><td><strong>Compute (IaaS)</strong></td><td><strong>EC2</strong> for virtual machines, with containers on ECS and EKS.</td><td><strong>Virtual Machines</strong> for IaaS, with containers on AKS.</td><td><strong>Compute Engine (GCE)</strong> for virtual machines, with containers on GKE.</td></tr>
<tr><td><strong>Serverless</strong></td><td><strong>Lambda</strong>, invoked by an event and billed per invocation.</td><td>Azure Functions.</td><td>Cloud Functions.</td></tr>
<tr><td><strong>Database</strong></td><td><strong>SimpleDB</strong> and the Relational Database Service (RDS); DynamoDB is the fully managed NoSQL store.</td><td>Azure SQL Database and Cosmos DB.</td><td><strong>Bigtable</strong>, the wide-column store, with Cloud SQL and Spanner as the managed relational offerings.</td></tr>
<tr><td><strong>The pattern</strong></td><td colspan="3">All three <strong>converged</strong>: each now offers virtual machines, containers, serverless functions, managed databases and object storage. Choosing between them is therefore not about which model they offer &mdash; they all offer all three &mdash; but about geography, price, ecosystem, tooling and whether the workload is already written for one of them.</td></tr>
</tbody>
</table>

<h3>What an IaaS provider actually supplies</h3>
<p>The services of a cloud platform, by layer:</p>
<table class="comparison-table">
<thead>
<tr><th>Service</th><th>What it provides</th></tr>
</thead>
<tbody>
<tr><td><strong>Compute</strong></td><td>Computing as a Service includes virtual central processing units and virtual main memory for the VMs that are provisioned to the end users.</td></tr>
<tr><td><strong>Storage</strong></td><td>The IaaS provider provides back-end storage for storing files.</td></tr>
<tr><td><strong>Network</strong></td><td>Network as a Service (NaaS) provides networking components such as routers, switches and bridges for the VMs.</td></tr>
<tr><td><strong>Load balancers</strong></td><td>It provides load balancing capability at the infrastructure layer.</td></tr>
</tbody>
</table>

<p>Two further notes from the same source. The <strong>top IaaS providers</strong> it lists are Amazon Web Services, Rackspace, Netmagic Solutions, Tata Communications, Sify Technologies and Reliance &mdash; a reminder that the market is not only the three American platforms. And the provider is not always the same kind of company. The case studies include <strong>IBM's Ensemble</strong>, which offers a virtualized cloud system for IaaS services, putting together a large resource pool to simplify management complexity. Tivoli Service Automation Manager is used for rapid design, deployment and management of service processes. <strong>WebSphere CloudBurst</strong> is another management platform.</p>
<h3>The advantages and disadvantages of the IaaS layer</h3>
<p>The customer's view of a rented platform:</p>
<table class="comparison-table">
<thead>
<tr><th>Advantages</th><th>What it means</th></tr>
</thead>
<tbody>
<tr><td><strong>Shared infrastructure</strong></td><td>IaaS allows multiple users to share the same physical infrastructure.</td></tr>
<tr><td>Web access to the resources</td><td>IaaS allows IT users to access resources over the internet.</td></tr>
<tr><td><strong>Pay-as-per-use model</strong></td><td>Providers offer services on a pay-as-per-use basis; users are required to pay for what they have used.</td></tr>
<tr><td>Focus on the core business</td><td>The customer can concentrate on its core business rather than on IT infrastructure, because the provider runs and maintains the hardware and the software underneath.</td></tr>
<tr><td><strong>On-demand scalability</strong></td><td>Users do not have to worry about upgrading software or troubleshooting hardware components.</td></tr>
</tbody>
</table>
<table class="comparison-table">
<thead>
<tr><th>Disadvantages</th><th>What it means</th></tr>
</thead>
<tbody>
<tr><td><strong>Security</strong></td><td>Security is one of the biggest issues in IaaS &mdash; most providers are not able to provide 100% security.</td></tr>
<tr><td>Maintenance and upgrade</td><td>Although IaaS service providers maintain the software, they do not upgrade the software for some organisations.</td></tr>
<tr><td><strong>Interoperability issues</strong></td><td>It is difficult to migrate a VM from one IaaS provider to another, so customers might face problems related to vendor lock-in.</td></tr>
</tbody>
</table>

<div class="concept-box key">
<h4>Why that third disadvantage is the important one</h4>
<p>"It is difficult to migrate a VM from one IaaS provider to the other, so the customers might face problem related to vendor lock-in." This is vendor lock-in with the mechanism attached: the difficulty of moving a <em>virtual machine</em> between providers. It also explains why a cloud reference architecture includes a <strong>portability/interoperability</strong> management function, and why the industry converged on containers and Kubernetes &mdash; an image that runs anywhere is, among other things, a lock-in remedy.</p>
</div>

<h3>The pizza analogy, which makes the three models concrete</h3>
<p>The delivery models as four ways of getting pizza:</p>
<table class="comparison-table">
<thead>
<tr><th>Model</th><th>The analogy</th><th>Who manages what</th></tr>
</thead>
<tbody>
<tr><td><strong>On-premises</strong></td><td><strong>Dined in at home</strong>: dining table, electric or gas oven, fire, pizza dough, tomato sauce, toppings, cheese &mdash; all made and provided by you.</td><td>The customer manages everything: infrastructure, platform and software.</td></tr>
<tr><td><strong>IaaS</strong></td><td>Take and bake: the vendor supplies the dough, sauce, toppings and cheese; the customer supplies the table, oven and fire.</td><td><strong>Customer manages</strong> the operating system, runtime and application; the vendor manages the virtual infrastructure.</td></tr>
<tr><td><strong>PaaS</strong></td><td><strong>Pizza delivered</strong>: the vendor brings the finished pizza and the oven work is done; the customer provides the table and the drinks.</td><td>The vendor manages infrastructure <em>and</em> platform; the customer manages only the application and its configuration.</td></tr>
<tr><td><strong>SaaS</strong></td><td><strong>Dined out</strong>: everything is the restaurant's, and the customer orders and eats.</td><td>The vendor manages everything; the customer manages only its data and its account.</td></tr>
</tbody>
</table>
<p>The service-model definitions say the same thing in formal language &mdash; the customer of IaaS "can deploy and run arbitrary software, including operating systems", the customer of PaaS "does not manage or control the underlying cloud infrastructure, including network, servers, operating systems or storage". The pizza table is the same thing in concrete terms.</p>
<h3>The wider family: XaaS</h3>
<p class="prereq-note">Outside the syllabus &mdash; 7.1 is the AWS, Azure and Google overview. XaaS generalises the three service models of 5.3, and the extra names &mdash; HaaS, CaaS and DaaS &mdash; are background.</p>
<p>The three models generalise into XaaS &mdash; Anything as a Service, or Everything-as-a-Service: a general collective term that refers to the delivery of anything as a service. It recognises the vast number of products, tools and technologies vendors now deliver to users as a service over a network &mdash; typically the internet &mdash; rather than providing them locally or on-site within an enterprise. The most common examples are the three general cloud computing models: SaaS, PaaS and IaaS, and more exist:</p>
<table class="comparison-table">
<thead>
<tr><th>Term</th><th>What is delivered</th></tr>
</thead>
<tbody>
<tr><td><strong>HaaS</strong> &mdash; Hardware as a Service</td><td>Managed service providers own hardware and install it at customers' sites on demand, and customers use it under SLAs. This pay-as-you-go model is similar to leasing and is comparable to IaaS when the computing resources sit at the provider's site as virtual equivalents of physical hardware. Especially cost-effective for small or mid-sized businesses.</td></tr>
<tr><td><strong>CaaS</strong> &mdash; Communication as a Service</td><td>Communication solutions such as VoIP, instant messaging and video conferencing hosted in the vendor's cloud, deployed selectively for the period needed and paid for over that period only.</td></tr>
<tr><td><strong>DaaS</strong> &mdash; Desktop as a Service</td><td>Desktops delivered as virtual services along with the apps needed, so a client works on a personal computer using third-party server capacity. The provider is typically responsible for storing, securing and backing up user data and for delivering upgrades to all supported desktop apps &mdash; the cloud-scale version of desktop virtualization.</td></tr>
<tr><td><strong>SECaaS</strong> &mdash; Security as a Service</td><td><strong>Outsourced security management</strong>: the provider integrates its security services into your infrastructure and delivers them over the Internet &mdash; anti-virus, encryption, authentication, intrusion detection and more.</td></tr>
<tr><td><strong>DBaaS</strong> &mdash; Database as a Service</td><td>Provides access to a database platform through the cloud; public cloud providers like AWS and Azure have DBaaS offerings.</td></tr>
<tr><td><strong>TaaS</strong> &mdash; Transportation as a Service</td><td>Transport applications delivered as a service &mdash; car sharing and ride-hailing via an app, paying for time used or distance covered.</td></tr>
<tr><td><strong>Also named</strong></td><td>HaaS (Healthcare as a Service), MaaS, NaaS, STaaS, DRaaS, DaaS and more — a dozen abbreviations in all. Some letters are reused with different meanings (HaaS is both Hardware and Healthcare), so always write the full name.</td></tr>
</tbody>
</table>
<p><strong>Benefits of XaaS</strong>: <strong>scalability</strong> &mdash; outsourcing gives access to effectively unlimited computing capacity, and a company can scale processes up and down without worrying about deployments or downtime. Then cost- and time-effectiveness: no equipment to buy or deploy, and a pay-as-you-go model. <strong>Focus on core competencies</strong>: no need to set up applications or train staff on them. High quality of services: professionals maintain the infrastructure and provide the latest updates. And better customer experience as a consequence.</p>
<h2>7.2 Storage services (S3, Blob, etc.)</h2>

<h3>The three shapes of cloud storage</h3>
<p>S3 and Blob are both <em>object</em> storage, and a platform offers three different shapes:</p>

<table class="comparison-table">
<thead>
<tr><th></th><th>Object storage</th><th>Block storage</th><th>File storage</th></tr>
</thead>
<tbody>
<tr><td><strong>What it stores</strong></td><td><strong>Objects</strong> in a flat namespace, each addressed by a key, with metadata alongside the bytes.</td><td><strong>Volumes</strong> &mdash; raw blocks attached to a virtual machine, which the guest OS formats with a file system.</td><td><strong>Files</strong> in directories, reachable by many machines at once over a network protocol.</td></tr>
<tr><td><strong>How it is used</strong></td><td>Through an HTTP API: PUT an object, GET an object. No file system, no mounting.</td><td>Attached to an instance, then used exactly like a disk.</td><td>Mounted as a shared directory by several instances.</td></tr>
<tr><td><strong>AWS</strong></td><td><strong>Amazon S3</strong> (Simple Storage Service) &mdash; buckets containing objects.</td><td><strong>Amazon EBS</strong> (Elastic Block Store), named in the course's reference book alongside EC2, S3 and SimpleDB.</td><td>Amazon EFS (Elastic File System).</td></tr>
<tr><td><strong>Azure</strong></td><td><strong>Blob Storage</strong>: containers holding blobs, with block blobs, append blobs and page blobs as the three blob types.</td><td>Managed Disks.</td><td>Azure Files.</td></tr>
<tr><td><strong>Google Cloud</strong></td><td>Cloud Storage: buckets containing objects.</td><td>Persistent Disk.</td><td>Filestore.</td></tr>
<tr><td><strong>Use it for</strong></td><td>Backups, static website assets, images and video, logs, data-lake inputs for analytics &mdash; anything written once and read many times.</td><td>The boot disk and working data of a virtual machine.</td><td>Shared data between several machines that all need the same files.</td></tr>
</tbody>
</table>
<h3>How object storage is actually shaped</h3>
<p>The facts below hold for both S3 and Blob:</p>
<ul>
<li>A bucket (S3) or container (Blob) is the top-level namespace. It holds objects, and it is the unit of policy, region and (in S3) globally unique naming.</li>
<li>An object is addressed by key &mdash; the full path-like name &mdash; <strong>within</strong> its bucket, with the object's data and its metadata. There are no real directories; a "/" in a key is only a convention the console displays as folders.</li>
<li>An object carries its data, and the service keeps four further things about it: the name, the modification time, an access control list, and up to four kilobytes of user-defined metadata. Object sizes run from one byte to five terabytes, which is what "large objects" means at this scale.</li>
<li>The API is HTTP verbs on a URL, which is why object storage needs no driver and works from any language: the storage interface is <em>REST</em>.</li>
<li>Operations are PUT, GET, DELETE (and copy), not open/read/write/seek. An object is replaced whole, so object storage suits write-once, read-many data &mdash; exactly the GFS/HDFS access pattern, and for the same reason.</li>
<li>Durability comes from replication across machines, and is quoted separately from availability. AWS documents S3 as designed for <strong>99.999999999% (eleven nines) durability</strong> for objects in standard storage; durability is the probability the data survives, availability is the probability the data can be reached right now. The two terms are often used interchangeably, and they are not the same thing.</li>
<li>Access tiers trade retrieval latency and cost against storage cost. S3 offers standard, infrequent-access, one-zone-infrequent-access, Glacier and Deep Archive classes; Azure offers hot, cool and archive tiers. The rule is the same everywhere: cheaper to keep, dearer or slower to fetch. Lifecycle rules move objects between tiers automatically as they age.</li>
<li>Versioning and replication are separate features: versioning keeps every overwritten version of an object (which is what makes accidental deletion recoverable), and cross-region replication copies buckets to another region for disaster recovery &mdash; the <strong>DRaaS</strong> entry in the XaaS list.</li>
</ul>

<div class="concept-box tip">
<h4>Storage virtualization</h4>
<p>Storage virtualization is aggregating physical storage into what appears to be a single storage device &mdash; or a pool of available storage capacity &mdash; managed from a central console. Servers are not aware of exactly where their data is stored, functioning "more like worker bees in a hive". Object storage is that idea taken to the API level: the bucket is the pool, the key is the address, and the client never learns or cares which physical disks hold its bytes.</p>
</div>

<h3>Databases as a service</h3>
<p>Storage also arrives managed, and DBaaS is the case here: Database as a Service provides access to a database platform through the cloud, and public cloud providers like AWS and Azure have DBaaS offerings. The distinction is <em>who administers the database</em>. A database <em>on</em> a rented virtual machine is IaaS with the customer's own DBMS on top: the customer sizes it, patches it, backs it up and runs its replicas. A managed database service keeps the platform and removes the administration, and AWS's <strong>SimpleDB</strong> shows exactly what that covers: it automatically manages infrastructure provisioning, hardware and software maintenance, replication and indexing of data items, and performance tuning.</p>

<p>The definition has two halves: a database platform delivered as a service, and the operational work transferred to the provider. The other half of the same shift: SimpleDB is a nonrelational data store that stores and queries data items via Web services requests, supporting store-and-query functions traditionally provided only by relational databases, with multiple geographically distributed copies of each data item. That is why the service is reachable over the <em>REST</em> interface rather than a database driver, exactly as object storage was.</p>

<table class="comparison-table">
<thead>
<tr><th></th><th>Database on IaaS (self-managed)</th><th>Managed database service (DBaaS)</th></tr>
</thead>
<tbody>
<tr><td><strong>You get</strong></td><td>A virtual machine and a blank operating system.</td><td>A running database endpoint, a connection string and a console.</td></tr>
<tr><td><strong>You do</strong></td><td>Install and patch the DBMS, size the storage, configure replication, schedule backups, test restores, tune queries, plan failover.</td><td>Model your schema and write your queries. Provisioning, patching, backup, replication, indexing and tuning are the provider's.</td></tr>
<tr><td><strong>Scaling</strong></td><td>Resize the instance and rebuild replicas yourself.</td><td>Change a tier, or add read replicas, from the console or an API.</td></tr>
<tr><td><strong>Course examples</strong></td><td>MySQL or PostgreSQL you install on EC2.</td><td><strong>SimpleDB</strong> (AWS's own list, alongside S3 and EBS); Bigtable, Google's wide-column store; Azure SQL and Cosmos DB on the Azure side.</td></tr>
</tbody>
</table>

<p>Two families sit under DBaaS, and a service belongs to one of them: <strong>relational</strong> (SQL, schemas, transactions, joins &mdash; right when correctness across several records matters). The other is non-relational or NoSQL (key-value, document, wide-column, graph &mdash; right when scale and a flexible shape matter more than joins). SimpleDB and Bigtable are both in the second family, which is the shift from traditional relational database systems to stores built for online transaction processing at network scale.</p>

<div class="concept-box tip">
<h4>One abbreviation, two meanings &mdash; and one boundary that moves</h4>
<p><strong>DaaS</strong> is the trap. Two readings exist: Desktop-as-a-Service, a virtual desktop with its apps delivered from the provider's servers, and Data as a Service. Writing the full name settles which one is meant. The second point is that DBaaS moves the <em>database</em> from "your responsibility" to "the provider's" &mdash; which is precisely the boundary an SLA puts around, and the shared responsibility model splits. When a managed service is breached through a misconfigured access policy, the provider was secure and the customer was not: the service was managed, the data was not.</p>
</div>
<h2>7.3 Compute services (EC2, Lambda, GCE)</h2>

<h3>The three shapes of compute</h3>
<p>Compute services come in three shapes, and they differ in how much of the stack the customer manages &mdash; which is the same axis as the VM-versus-container comparison, extended one step further to functions:</p>

<table class="comparison-table">
<thead>
<tr><th></th><th>Virtual machines (IaaS)</th><th>Containers</th><th>Serverless functions</th></tr>
</thead>
<tbody>
<tr><td>AWS / Azure / Google</td><td><strong>EC2</strong> / Virtual Machines / Compute Engine (GCE)</td><td>ECS and EKS / AKS / GKE</td><td><strong>Lambda</strong> / Azure Functions / Cloud Functions</td></tr>
<tr><td><strong>Customer manages</strong></td><td>The guest OS, patches, runtime, application, scaling.</td><td>The container image and the orchestration configuration.</td><td><strong>Only the function's code</strong> and its configuration.</td></tr>
<tr><td><strong>Started by</strong></td><td>The customer boots it, and it stays up (and bills) until it is stopped.</td><td>The orchestrator schedules it; it stays up while needed.</td><td><strong>An event</strong> &mdash; an HTTP request, a file arriving in storage, a queue message, a schedule.</td></tr>
<tr><td><strong>Billing</strong></td><td>Per hour or per second of instance time, whether or not it is busy.</td><td>For the nodes running the containers (or per-container in some managed offerings).</td><td>Per invocation and per unit of execution time, with a free tier &mdash; nothing runs, nothing is charged.</td></tr>
<tr><td><strong>Scaling</strong></td><td>Manual or auto-scaling groups, driven by metrics.</td><td>The orchestrator adds or removes container replicas.</td><td>Automatic and per request; the platform runs as many copies as are needed.</td></tr>
<tr><td><strong>Best for</strong></td><td>Long-running services, anything needing a specific OS or kernel, licensed software, and workloads with a steady load (where a reserved instance is cheapest).</td><td>Many copies of one stack, rapid deployment, portability between clouds.</td><td>Short, event-driven, spiky work: glue between services, image thumbnailing, scheduled jobs, webhooks.</td></tr>
<tr><td><strong>Worst for</strong></td><td>Variable or intermittent load &mdash; you pay for idle hours.</td><td>Workloads needing different kernels or strong isolation between tenants.</td><td>Long-running or stateful processes, and anything with a cold-start latency problem.</td></tr>
</tbody>
</table>

<figure class="figure-wide figure-wrap">
<svg class="figure wide" viewBox="0 0 790 300" role="img" aria-label="Three compute models side by side showing how much of the stack the customer manages: with virtual machines the customer manages everything above the hypervisor; with containers the customer manages the application and image; with serverless functions the customer manages only the code">
<defs><marker id="f7a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="flow-arrow-head"/></marker></defs>

<text class="flow-label" x="140" y="26" text-anchor="middle">Virtual machine</text>
<text class="flow-label" x="395" y="26" text-anchor="middle">Container</text>
<text class="flow-label" x="650" y="26" text-anchor="middle">Serverless function</text>

<rect class="flow-box phase1" x="40" y="44" width="200" height="34" rx="8"/><text class="flow-label" x="140" y="66" text-anchor="middle">Application</text>
<rect class="flow-box phase1" x="40" y="84" width="200" height="34" rx="8"/><text class="flow-label" x="140" y="106" text-anchor="middle">Runtime and libraries</text>
<rect class="flow-box phase1" x="40" y="124" width="200" height="34" rx="8"/><text class="flow-label" x="140" y="146" text-anchor="middle">Guest operating system</text>
<rect class="flow-box phase2" x="40" y="164" width="200" height="34" rx="8"/><text class="flow-label" x="140" y="186" text-anchor="middle">Hypervisor &mdash; provider</text>
<rect class="flow-box phase4" x="40" y="204" width="200" height="34" rx="8"/><text class="flow-label" x="140" y="226" text-anchor="middle">Hardware &mdash; provider</text>

<rect class="flow-box phase1" x="295" y="84" width="200" height="34" rx="8"/><text class="flow-label" x="395" y="106" text-anchor="middle">Application</text>
<rect class="flow-box phase1" x="295" y="124" width="200" height="34" rx="8"/><text class="flow-label" x="395" y="146" text-anchor="middle">Image: code, deps, config</text>
<rect class="flow-box phase2" x="295" y="164" width="200" height="34" rx="8"/><text class="flow-label" x="395" y="186" text-anchor="middle">Container engine &mdash; provider</text>
<rect class="flow-box phase4" x="295" y="204" width="200" height="34" rx="8"/><text class="flow-label" x="395" y="226" text-anchor="middle">Host OS and hardware</text>

<rect class="flow-box phase1" x="550" y="124" width="200" height="34" rx="8"/><text class="flow-label" x="650" y="146" text-anchor="middle">Function code</text>
<rect class="flow-box phase2" x="550" y="164" width="200" height="34" rx="8"/><text class="flow-label" x="650" y="186" text-anchor="middle">Everything else: the platform</text>
<rect class="flow-box phase4" x="550" y="204" width="200" height="34" rx="8"/><text class="flow-label" x="650" y="226" text-anchor="middle">executes it on demand</text>

<path class="flow-arrow" d="M244,120 H291" marker-end="url(#f7a)"/>
<path class="flow-arrow" d="M499,150 H546" marker-end="url(#f7a)"/>
<text class="flow-label" x="270" y="272" text-anchor="middle">less to manage</text>
<text class="flow-label" x="525" y="272" text-anchor="middle">less to manage</text>
<text class="flow-label" x="395" y="292" text-anchor="middle">Each step to the right removes a layer the customer patches, scales and pays for &mdash; and removes a layer the customer controls.</text>
</svg>
<figcaption>Fig 7.1 &mdash; The three compute models by layers managed. A virtual machine is Unit 6.2's guest OS with everything above it; a container is the same application with the OS replaced by a shared kernel; serverless is the application alone, with the platform starting and stopping it per event. The trade is control for convenience, exactly as in the container comparison.</figcaption>
</figure>

<h3>EC2 &mdash; the virtual machine service</h3>
<div class="example-box">
<h4>Example: Amazon EC2</h4>
<p>The definition: Amazon's Elastic Compute Cloud (EC2) is a good example of a web service that provides elastic computing power in a cloud, and EC2 permits customers to create VMs and to manage user accounts over the time of their use. The implementation detail: EC2 uses Xen as the virtual machine monitor, and the same VMM is used in IBM's Blue Cloud. In EC2 some predefined VM templates are also provided, and users can choose different kinds of VMs from the templates. An <em>image</em>, or Amazon Machine Image, is that template. IBM's Blue Cloud does not provide any VM templates, since in general any type of VM can run on top of Xen.</p>

<p>The terms, all of them documented vendor behaviour:</p>
<ul>
<li><strong>Instance</strong> &mdash; one running virtual machine; <strong>instance type</strong> &mdash; its CPU, memory and network profile (families optimized for compute, memory, storage or GPU).</li>
<li><strong>AMI (image)</strong> &mdash; the template an instance is launched from.</li>
<li><strong>Security group</strong> &mdash; the firewall rules around an instance; this is access control in practice.</li>
<li>Elastic IP, VPC, load balancer &mdash; the network services: addresses, an isolated virtual network, and the load balancer at the infrastructure layer.</li>
<li><strong>Purchasing models</strong> &mdash; on-demand (per second, no commitment), reserved (a one- or three-year commitment for a large discount, right for steady load) and spot (spare capacity at a deep discount, reclaimable by the provider &mdash; the cloud version of the "interruptible" work in 6.4). Google's equivalent of spot instances is <strong>preemptible VMs</strong>.</li>
<li><strong>Auto-scaling</strong> &mdash; the demand-driven provisioning implemented as a service: Amazon implements such an auto-scale feature in its EC2 platform.</li>
</ul>

</div>
<h4>The instance lifecycle</h4>
<p>An instance is not simply on or off. It moves through a small set of states, and the address is what changes with them.</p>
<ol>
<li><strong>Launch</strong> &mdash; an instance is created from a predefined Amazon Machine Image (AMI), digitally signed and stored in S3, or from a user-defined image. The image carries the operating system, the runtime environment, the libraries and the application, but no configuration-dependent information such as the hostname or the MAC address. When it launches, the instance is given a DNS name, which maps to a private IP address for communication inside the provider's own network and a public IP address for communication outside it.</li>
<li><strong>Running</strong> &mdash; the instance is a virtual private server with root access. It specifies the maximum amount of resources available to the application, the interface for that instance, and the cost per hour, and it can be placed in different regions and availability zones.</li>
<li><strong>Stop</strong> &mdash; the instance can be stopped and started again. The public IP address is assigned for the lifetime of the instance and returns to the pool of available addresses when the instance is stopped or terminated.</li>
<li><strong>Reboot</strong> &mdash; the guest operating system restarts and the instance keeps its identity. This is not a new instance, so it is not a new allocation of capacity.</li>
<li><strong>Terminate</strong> &mdash; the instance is destroyed and its resources are released, which ends its billing. The one address that behaves differently is the <em>elastic IP address</em>: a static public address allocated to the account, which is not released when an instance is stopped or terminated and must be released when it is no longer needed.</li>
<li><strong>Image</strong> &mdash; a new image can be created from a configured instance and tagged to identify it, which is how one instance becomes the template for the next.</li>
</ol>

<h3>Lambda &mdash; the serverless service</h3>
<div class="example-box">
<h4>Example: AWS Lambda (Serverless)</h4>
<p><strong>Serverless</strong> is the name for the model in which the provider runs the code and the customer does not manage, size or pay for servers at all. AWS Lambda is the canonical example, with these properties:</p>
<ul>
<li>An event starts the code and it ends when the function returns. There is no server to boot, so nothing bills while the function is not running &mdash; which is why the billing unit is invocations and execution duration rather than time.</li>
<li>Scaling is per request and automatic. Each invocation is independent, so the platform runs as many concurrent copies as the incoming traffic needs &mdash; the extreme end of elasticity.</li>
<li>Functions are stateless between invocations. State belongs in storage or a database, which is why serverless designs lean on the object storage and managed databases of 7.2.</li>
<li>The trade is the same as ever, pushed further: the customer controls less. There is no OS to configure (and none to tune), execution time is capped, and a burst of cold starts can add latency to the first request after idle.</li>
<li>The comparison to the other two models: a virtual machine is elastic capacity you keep running, a container is a packaged application the orchestrator schedules, and a function is a piece of code the platform invokes.</li>
</ul>

</div>
<h4>The execution path of one invocation</h4>
<ol>
<li><strong>Trigger</strong> &mdash; an event arrives from a source: an HTTP request through the API gateway, an object written to a bucket, a message on a queue, or a schedule.</li>
<li><strong>Environment</strong> &mdash; the platform starts an isolated execution environment holding the runtime and the function's code. It is created for the invocation rather than booted by a customer, and it does not exist before the event arrives.</li>
<li><strong>Execution</strong> &mdash; the function runs with the event's data and returns a result or fails, and the platform records the invocation for logging and billing.</li>
<li><strong>Reuse</strong> &mdash; the environment is kept for a short time so the next invocation can use it again, which is why a repeated call is fast and the first call after an idle period is not. The cold start is the cost of building the environment.</li>
<li><strong>Idle</strong> &mdash; when the traffic stops, no copy of the function keeps running, so the platform holds zero copies between events. That is <em>scale to zero</em>, and it is the property a virtual machine cannot have, because a stopped instance is an instance someone stopped and a running one bills by the hour.</li>
</ol>

<h3>GCE, and why the three platforms look alike</h3>
<div class="example-box">
<h4>Example: Google Compute Engine (GCE)</h4>
<p><strong>Google Compute Engine (GCE)</strong> is Google's virtual machine service and the direct counterpart of EC2 and Azure Virtual Machines: instances from images, attached persistent disks, a virtual network with firewall rules, load balancing, and per-second billing with sustained-use discounts and preemptible VMs for interruptible work. Its distinguishing feature in practice is not the instance model but the ecosystem around it &mdash; the same Kubernetes origins (Google built and open-sourced Kubernetes) and the data and ML services that sit on top.</p>

<p>All three platforms converge on the same catalogue: the services are APIs, and an API that is widely used becomes a de facto standard. Object storage's API shape, virtual machines with images and disks, containers with an orchestrator, functions invoked by events &mdash; once one provider defines a useful interface, the others must offer an equivalent or lose the customer's application. That is also what makes the portability problem partial rather than total: the <em>concepts</em> transfer, and it is the management APIs, identity model, billing and proprietary services that do not.</p>

</div>
<h3>Managing a platform</h3>
<p>A platform is used through a console, an API, a CLI and SDKs. It is organised by <strong>region</strong> (a geographic area) and <strong>availability zone</strong> (an isolated set of data centres within it) &mdash; which is a fault-domain decision applied as a design rule: place replicas across zones so that one zone's failure is survivable. The provider's own requirements are the reference architecture of 6.3 &mdash; orchestration, resource abstraction and control, physical resources, and the management functions. Each of those layers is designed for high throughput, high availability and fault tolerance, and each provides an interface to the layer above it.</p>

<div class="concept-box tip">
<h4>The concrete names for each topic</h4>
<p>The named technologies, one family per topic: edge and fog computing for moving computation to the data; Lambda, Azure Functions and Google Cloud Functions for serverless. Docker is for packaging and Kubernetes for orchestration; and EC2, Azure Virtual Machines and Google Compute Engine (GCE) for the virtual machines that everything above still runs on. In storage the names are Amazon S3, Azure Blob Storage and Cloud Storage, and in managed databases SimpleDB and Bigtable.</p>
</div>

<p class="past-pointer">Questions on this unit, with model answers, are on the <a href="#/ch/7/past">Past Questions</a> tab.</p>
`,

  revise: {"what-a-cloud-platform-is":"<p>A <strong>cloud provider</strong> is a company offering computing services over the Internet and charging for them by usage.</p>\n<ul>\n<li>The platform is the whole of what that provider offers: the three delivery models in one catalogue.</li>\n<li>IaaS comes from Amazon, Windows Azure and Rackspace; PaaS from Google, Salesforce.com and Facebook.</li>\n<li>EC2 is the IaaS example, Google App Engine and Windows Azure the PaaS examples, Gmail and Salesforce the SaaS examples.</li>\n<li>Three questions of any platform: what is rented, where it is, and how it is billed.</li>\n</ul>\n","the-three-platforms":"<p>AWS, Microsoft Azure and Google Cloud are the three platforms.</p>\n<ul>\n<li>AWS: the first mover and largest catalogue; EC2 uses Xen as its virtual machine monitor; S3 is object storage; Lambda is serverless.</li>\n<li>Azure: began as a managed application platform, then expanded into virtual machines and SaaS.</li>\n<li>Google Cloud: began with App Engine and expanded into virtual machines and Kubernetes.</li>\n<li>Each now offers virtual machines, containers, functions and object storage, so the choice is geography, price and ecosystem.</li>\n</ul>\n","what-an-iaas-provider-actually-supplies":"<p>The services of a cloud platform, by layer.</p>\n<ul>\n<li><strong>Compute</strong>: virtual central processing units and virtual main memory for the VMs provisioned to end users.</li>\n<li><strong>Storage</strong>: the provider supplies back-end storage for storing files.</li>\n<li><strong>Network</strong>: Network as a Service provides routers, switches and bridges for the VMs.</li>\n<li><strong>Load balancers</strong>: load balancing capability at the infrastructure layer.</li>\n<li>Top providers include Amazon Web Services, Rackspace, Netmagic Solutions, Tata Communications, Sify Technologies and Reliance.</li>\n</ul>\n","the-advantages-and-disadvantages-of-the-iaas-layer":"<p>The customer's view of a rented platform.</p>\n<ul>\n<li>Advantages: shared infrastructure, web access to the resources, a pay-as-per-use model, focus on the core business, and on-demand scalability.</li>\n<li>Disadvantages: security, since most providers cannot give 100% security.</li>\n<li>Maintenance and upgrade: providers maintain the software but do not upgrade it for some organisations.</li>\n<li>Interoperability: migrating a VM from one provider to another is difficult, so customers face vendor lock-in.</li>\n</ul>\n","the-pizza-analogy-which-makes-the-three-models-concrete":"<p>The delivery models as four ways of getting pizza.</p>\n<ul>\n<li><strong>On-premises</strong>: dined in at home &mdash; the customer manages everything.</li>\n<li><strong>IaaS</strong>: take and bake &mdash; the vendor supplies the dough, sauce, toppings and cheese; the customer supplies the table, oven and fire.</li>\n<li><strong>PaaS</strong>: pizza delivered &mdash; the vendor brings the finished pizza; the customer provides the table and the drinks and manages only the application.</li>\n<li><strong>SaaS</strong>: dined out &mdash; everything is the restaurant's, and the customer manages only its data and its account.</li>\n</ul>\n","the-wider-family-xaas":"<p><strong>XaaS</strong> &mdash; Anything as a Service &mdash; delivers anything over a network rather than locally.</p>\n<ul>\n<li>HaaS: managed service providers own hardware and install it at customers' sites on demand.</li>\n<li>CaaS: VoIP, instant messaging and video conferencing hosted in the vendor's cloud.</li>\n<li>DaaS: desktops delivered as virtual services, with the provider backing up the data.</li>\n<li>SECaaS: outsourced security management &mdash; anti-virus, encryption, authentication.</li>\n<li>DBaaS: a database platform through the cloud; TaaS: transport applications paid for by distance.</li>\n</ul>\n","the-three-shapes-of-cloud-storage":"<p>S3 and Blob are both object storage, in three shapes.</p>\n<ul>\n<li><strong>Object storage</strong>: objects in a flat namespace, each addressed by a key, used through an HTTP API &mdash; PUT an object, GET an object.</li>\n<li><strong>Block storage</strong>: volumes of raw blocks attached to a virtual machine, which the guest OS formats with a file system.</li>\n<li><strong>File storage</strong>: files in directories, mounted as a shared directory by several instances.</li>\n<li>AWS: S3, EBS and EFS; Azure: Blob Storage, Managed Disks and Azure Files; Google: Cloud Storage, Persistent Disk and Filestore.</li>\n</ul>\n","how-object-storage-is-actually-shaped":"<p>Both S3 and Blob behave alike.</p>\n<ul>\n<li>A <strong>bucket</strong> or container is the top-level namespace: the unit of policy and naming.</li>\n<li>An <strong>object</strong> is addressed by key within its bucket; there are no real directories.</li>\n<li>Metadata: name, modification time and access control list, plus four kilobytes of user fields.</li>\n<li>The API is HTTP verbs on a URL &mdash; PUT, GET, DELETE &mdash; so the interface is REST.</li>\n<li>Durability comes from replication; availability is separate: 99.999999999%.</li>\n<li>Tiers trade retrieval cost against storage cost; lifecycle rules move objects between tiers.</li>\n</ul>\n","databases-as-a-service":"<p><strong>Database as a Service</strong> provides access to a database platform through the cloud; AWS and Azure both have offerings.</p>\n<ul>\n<li>The distinction is who administers the database.</li>\n<li>On a rented virtual machine it is IaaS with your own DBMS on top: you size it, patch it, back it up and run its replicas.</li>\n<li>A managed database keeps the platform and removes the administration: provisioning, maintenance, replication, indexing and tuning.</li>\n<li>Two families: relational (SQL, schemas, transactions, joins) and non-relational (key-value, document, wide-column, graph).</li>\n<li>Course examples: SimpleDB and Bigtable, both non-relational.</li>\n</ul>\n","the-three-shapes-of-compute":"<p>Compute comes in three shapes, differing in how much of the stack the customer manages.</p>\n<ul>\n<li><strong>Virtual machines</strong>: EC2, Azure Virtual Machines and Compute Engine; the customer manages the guest OS, patches, runtime and scaling.</li>\n<li><strong>Containers</strong>: ECS, AKS and GKE; the customer manages the image and the orchestration, and the orchestrator schedules it.</li>\n<li><strong>Serverless functions</strong>: Lambda, Azure Functions and Cloud Functions; the customer manages only the code, started by an event and billed per invocation.</li>\n<li>Each step removes a layer the customer patches, scales and pays for.</li>\n</ul>\n","ec2-the-virtual-machine-service":"<p>EC2 is a web service providing elastic computing power.</p>\n<ul>\n<li>Xen is its VMM, the same one as IBM's Blue Cloud, with predefined VM templates (AMIs).</li>\n<li>Instance: one running VM; instance type: its CPU, memory and network profile. Security group: its firewall rules.</li>\n<li>Lifecycle: launch, run, stop and start, reboot, terminate. The public IP returns to the pool on stop or terminate; an elastic IP does not.</li>\n<li>On-demand, reserved and spot: per second, a commitment for a discount, or reclaimable spare capacity.</li>\n<li>Auto-scaling is demand-driven provisioning implemented as a service.</li>\n</ul>\n","lambda-the-serverless-service":"<p>Serverless means the provider runs the code; the customer does not manage servers.</p>\n<ul>\n<li>A trigger starts a fresh execution environment, reused while traffic continues; no copy stays running when it stops, and billing is per invocation.</li>\n<li>Scaling is per request and automatic: the platform runs as many copies as the traffic needs.</li>\n<li>Functions are stateless between invocations, so state belongs in storage or a database.</li>\n<li>The trade, pushed further: no OS to configure, execution time capped, and cold starts add latency.</li>\n</ul>\n","gce-and-why-the-three-platforms-look-alike":"<p><strong>Google Compute Engine</strong> is the counterpart of EC2 and Azure Virtual Machines.</p>\n<ul>\n<li>Instances from images, attached persistent disks, a virtual network with firewall rules and load balancing.</li>\n<li>Its distinguishing feature is the ecosystem around it: the Kubernetes origins and the data and machine-learning services on top.</li>\n<li>All three converge because the services are APIs, and a widely used API becomes a de facto standard.</li>\n<li>So lock-in is partial: the concepts transfer, but the management APIs, identity model and proprietary services do not.</li>\n</ul>\n","managing-a-platform":"<p>A platform is used through a console, an API, a CLI and SDKs.</p>\n<ul>\n<li>It is organised by <strong>region</strong>, a geographic area, and <strong>availability zone</strong>, an isolated set of data centres within it.</li>\n<li>That is a fault-domain rule: place replicas across zones so one zone's failure is survivable.</li>\n<li>The provider's own requirements are the reference architecture: orchestration, resource abstraction and control, physical resources and management.</li>\n<li>Its software stack is designed for high throughput, high availability and fault tolerance, each layer providing an interface above.</li>\n</ul>\n"},
  pastSummary: `<h2>Exam-facing summary</h2>
<table class="comparison-table">
<thead>
<tr><th>If the question says&hellip;</th><th>Give&hellip;</th></tr>
</thead>
<tbody>
<tr><td>Give an overview of AWS, Azure and Google Cloud</td><td>AWS began as IaaS (EC2, S3, EBS, SimpleDB named in Hwang) and is the course's IaaS example; Azure is the course's PaaS example (Windows Azure) and uses virtualization; Google Cloud is the other PaaS example (App Engine) and now also offers Compute Engine. All three converged on the same catalogue &mdash; virtual machines, containers, serverless, managed databases, object storage &mdash; and differ by geography, pricing, ecosystem and lock-in rather than by model.</td></tr>
<tr><td>Describe the services an IaaS provider offers</td><td>Compute (virtual CPUs and virtual main memory for VMs), storage (back-end storage for files), network (NaaS: routers, switches, bridges for the VMs) and load balancing at the infrastructure layer.</td></tr>
<tr><td>Advantages and disadvantages of IaaS</td><td>Advantages: shared infrastructure, web access to resources, pay-as-per-use, focus on the core business, on-demand scalability. Disadvantages: security, maintenance and upgrade, and interoperability issues causing vendor lock-in.</td></tr>
<tr><td>Explain the cloud service models with an analogy</td><td>The pizza table &mdash; on-premises as dining in at home, IaaS as take-and-bake, PaaS as pizza delivered, SaaS as dining out.</td></tr>
<tr><td>What is XaaS?</td><td>Anything/Everything as a Service: the collective term for delivering products, tools and technologies to users as a service over a network rather than locally; the three common models are SaaS, PaaS and IaaS, with HaaS, CaaS, DaaS, SECaaS, DBaaS and TaaS as further members &mdash; and the listed benefits of scalability, cost- and time-effectiveness, focus on core competencies, service quality and customer experience.</td></tr>
<tr><td>Explain storage services (S3, Blob)</td><td>Object storage as buckets/containers of objects addressed by key and reached over an HTTP API; the three shapes (object, block, file) with S3/EBS/EFS, Blob/Managed Disks/Azure Files and Cloud Storage/Persistent Disk/Filestore; write-once read-many fit; durability versus availability, with S3's eleven-nines durability design figure; access tiers with lifecycle rules; versioning and cross-region replication.</td></tr>
<tr><td>Explain compute services (EC2, Lambda, GCE)</td><td>EC2 as elastic virtual machines with images, security groups, networks, purchasing models and auto-scaling (the demand-driven provisioning of 6.4); Lambda as event-driven serverless with per-invocation billing, automatic scaling and stateless functions; GCE as Google's VM service with preemptible VMs; and the three-model table and Fig 7.1 showing what each model leaves the customer to manage.</td></tr>
<tr><td>Why is vendor lock-in a problem?</td><td>Because migrating a VM between IaaS providers is difficult, as the reference deck states &mdash; which is also why the reference architecture includes portability and interoperability, and why containers and Kubernetes are a partial remedy.</td></tr>
</tbody>
</table>


`,

  slides: `
<h2>The teacher's slides for this unit</h2>
<p class="ref-intro">These are the pictures that came with this unit &mdash; the class deck, the reference notes and the pages handed out with them &mdash; collected here so that the notes above read as writing rather than as a pile of screenshots. Each group is headed by the section of the notes its pictures belong to, in that order, and names the file and the slides they came from. The diagrams the notes themselves need are drawn in the notes.</p>

<h3>What a cloud platform is</h3>

<p class="ref-meta">From <em>Ref_CloudComptng.pptx</em>, slide 74.</p>

<!-- dcc-fig:ch5/ref-cloudcomptng-s74-130.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ref-cloudcomptng-s74-130.webp" alt="Illustration for What a cloud platform is" width="620" height="347" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>What an IaaS provider actually supplies</h3>

<p class="ref-meta">From <em>Ref_CloudComptng.pptx</em>, slide 56.</p>

<!-- dcc-fig:ch5/ref-cloudcomptng-s56-125.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ref-cloudcomptng-s56-125.webp" alt="Top Iaas Providers who are providing IaaS cloud computing platform" width="660" height="421" loading="lazy" decoding="async">
<figcaption>Top Iaas Providers who are providing IaaS cloud computing platform</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>The advantages and disadvantages of the IaaS layer</h3>

<p class="ref-meta">From <em>Ref_CloudComptng.pptx</em>, slide 111.</p>

<!-- dcc-fig:ch5/ref-cloudcomptng-s111-148.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ref-cloudcomptng-s111-148.webp" alt="Illustration for The advantages and disadvantages of the IaaS layer" width="1210" height="1303" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>The pizza analogy, which makes the three models concrete</h3>

<p class="ref-meta">From <em>Ref_CloudComptng.pptx</em>, slides 57, 66, 68 and 77.</p>

<!-- dcc-fig:ch5/ref-cloudcomptng-s68-129.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ref-cloudcomptng-s68-129.webp" alt="Illustration for The pizza analogy, which makes the three models concrete" width="1041" height="561" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch5/ref-cloudcomptng-s57-126.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ref-cloudcomptng-s57-126.webp" alt="Illustration for The pizza analogy, which makes the three models concrete" width="619" height="517" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch5/ref-cloudcomptng-s66-128.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ref-cloudcomptng-s66-128.webp" alt="Illustration for The pizza analogy, which makes the three models concrete" width="1142" height="542" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch5/ref-cloudcomptng-s77-131.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ref-cloudcomptng-s77-131.webp" alt="Illustration for The pizza analogy, which makes the three models concrete" width="400" height="400" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>The wider family: XaaS</h3>

<p class="ref-meta">From <em>Ref_CloudComptng.pptx</em>, slides 95 and 108.</p>

<!-- dcc-fig:ch5/ref-cloudcomptng-s95-146.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ref-cloudcomptng-s95-146.webp" alt="Illustration for The wider family: XaaS" width="704" height="513" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch5/ref-cloudcomptng-s108-147.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ref-cloudcomptng-s108-147.webp" alt="Illustration for The wider family: XaaS" width="1210" height="1316" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>Other pictures from this unit</h3>

<p class="ref-meta">From <em>Ref_CloudComptng.pptx</em>, slide 61.</p>

<!-- dcc-fig:ch5/ref-cloudcomptng-s61-127.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ref-cloudcomptng-s61-127.webp" alt="The following diagram shows how PaaS offers an API and development tools to the developers and how it helps…" width="560" height="427" loading="lazy" decoding="async">
<figcaption>The following diagram shows how PaaS offers an API and development tools to the developers and how it helps…</figcaption>
</figure>
<!-- /dcc-fig -->

<h2>Extra slides from the reference deck, not on the syllabus</h2>
<p>The reference deck's slides 79&ndash;93 are a survey of networking protocols &mdash; what a protocol is, the gossip or epidemic protocol, OSI and CNLP fragmentation, routing with IP/IPX/RIP, multicast, SSH and SFTP, packet loss, XMPP, wireless protocols, IGRP, PTP and MTP. The syllabus names <em>none</em> of them: search the printed sub-topics for protocol, OSI, routing, gossip, CNLP or MTP and there is no match, and no question on the Model Question 2025 concerns them. They are kept here because they are your teacher's material and worth seeing once, in one place, labelled for what they are &mdash; rather than scattered through the unit, where a slide about routing defaults sits under a heading about pizza. Nothing here is examinable from this syllabus; the messaging and web-service material that <em>is</em> examinable is Unit 2.</p>
<!-- dcc-fig:ch5/ref-cloudcomptng-s80-132.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ref-cloudcomptng-s80-132.webp" alt="Illustration from material outside the syllabus" width="638" height="479" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->
<!-- dcc-fig:ch5/ref-cloudcomptng-s81-133.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ref-cloudcomptng-s81-133.webp" alt="Illustration from material outside the syllabus" width="638" height="479" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->
<!-- dcc-fig:ch5/ref-cloudcomptng-s82-134.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ref-cloudcomptng-s82-134.webp" alt="Illustration from material outside the syllabus" width="638" height="479" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->
<!-- dcc-fig:ch5/ref-cloudcomptng-s83-135.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ref-cloudcomptng-s83-135.webp" alt="Illustration from material outside the syllabus" width="638" height="479" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->
<!-- dcc-fig:ch5/ref-cloudcomptng-s84-136.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ref-cloudcomptng-s84-136.webp" alt="Illustration from material outside the syllabus" width="638" height="479" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->
<!-- dcc-fig:ch5/ref-cloudcomptng-s85-137.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ref-cloudcomptng-s85-137.webp" alt="Illustration from material outside the syllabus" width="638" height="479" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->
<!-- dcc-fig:ch5/ref-cloudcomptng-s86-138.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ref-cloudcomptng-s86-138.webp" alt="Illustration from material outside the syllabus" width="638" height="479" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->
<!-- dcc-fig:ch5/ref-cloudcomptng-s87-139.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ref-cloudcomptng-s87-139.webp" alt="Illustration from material outside the syllabus" width="638" height="479" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->
<!-- dcc-fig:ch5/ref-cloudcomptng-s88-140.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ref-cloudcomptng-s88-140.webp" alt="Illustration from material outside the syllabus" width="638" height="479" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->
<!-- dcc-fig:ch5/ref-cloudcomptng-s89-141.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ref-cloudcomptng-s89-141.webp" alt="Illustration from material outside the syllabus" width="638" height="479" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->
<!-- dcc-fig:ch5/ref-cloudcomptng-s90-142.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ref-cloudcomptng-s90-142.webp" alt="Illustration from material outside the syllabus" width="638" height="479" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->
<!-- dcc-fig:ch5/ref-cloudcomptng-s91-143.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ref-cloudcomptng-s91-143.webp" alt="Illustration from material outside the syllabus" width="638" height="479" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->
<!-- dcc-fig:ch5/ref-cloudcomptng-s92-144.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ref-cloudcomptng-s92-144.webp" alt="Illustration from material outside the syllabus" width="638" height="479" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->
<!-- dcc-fig:ch5/ref-cloudcomptng-s93-145.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch5/ref-cloudcomptng-s93-145.webp" alt="Illustration from material outside the syllabus" width="638" height="479" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->
`,
  quiz: [
    {
      q: 'Which four service groups does an IaaS provider supply?',
      options: [
        'Compute, storage, network and load balancers',
        'Email, office software, CRM and storage',
        'Compilers, runtimes, frameworks and databases',
        'Regions, zones, consoles and billing'
      ],
      answer: 0,
      explanation: 'Compute (virtual CPUs and virtual main memory for the VMs), storage (back-end storage for files), network (Network as a Service — routers, switches and bridges for the VMs) and load balancing at the infrastructure layer.'
    },
    {
      q: 'Which of these is listed as a disadvantage of the IaaS layer?',
      options: [
        'It does not allow users to share physical infrastructure',
        'Interoperability issues — it is difficult to migrate a VM from one IaaS provider to another, leading to vendor lock-in',
        'It charges a flat monthly fee regardless of use',
        'It requires the customer to own the hardware'
      ],
      answer: 1,
      explanation: 'The three disadvantages are security (no provider can offer 100% security), maintenance and upgrade (providers maintain software but do not upgrade it for some organisations) and interoperability issues causing vendor lock-in.'
    },
    {
      q: 'In the pizza analogy for cloud service models, IaaS corresponds to:',
      options: [
        'Dining out at a restaurant',
        'Dining in at home and making everything yourself',
        'Take and bake — the vendor delivers the ingredients, you supply the oven',
        'Having a pizza delivered'
      ],
      answer: 2,
      explanation: 'Take-and-bake is IaaS: the vendor supplies the dough, sauce, toppings and cheese while you provide the table, oven and fire. On-premises is dining in at home, PaaS is pizza delivered (the oven work is done for you) and SaaS is dining out (everything is the restaurant\'s).'
    },
    {
      q: 'What is XaaS?',
      options: [
        'A single vendor\'s product family',
        'A collective term for delivering anything (products, tools, technologies) as a service over a network rather than locally',
        'A security standard for cloud APIs',
        'The billing system used by cloud providers'
      ],
      answer: 1,
      explanation: 'XaaS — Anything/Everything as a Service — recognises the many things vendors now deliver over the internet. The most common examples are SaaS, PaaS and IaaS, with others such as Hardware-as-a-Service, Communication-as-a-Service, Desktop-as-a-Service, Security-as-a-Service, Database-as-a-Service and Transportation-as-a-Service.'
    },
    {
      q: 'Which XaaS model is described as especially cost-effective for small or mid-sized businesses, and similar to leasing?',
      options: [
        'HaaS — Hardware as a Service',
        'SECaaS — Security as a Service',
        'TaaS — Transportation as a Service',
        'DRaaS'
      ],
      answer: 0,
      explanation: 'In HaaS (here Hardware as a Service), managed service providers own hardware and install it at customers\' sites on demand, with customers using it under SLAs on a pay-as-you-go basis — comparable to IaaS when computing resources sit at the provider\'s site as virtual equivalents of physical hardware.'
    },
    {
      q: 'Which storage shape stores objects addressed by a key and reached over an HTTP API rather than being mounted?',
      options: [
        'Block storage',
        'File storage',
        'Object storage',
        'Archive storage'
      ],
      answer: 2,
      explanation: 'Object storage — Amazon S3 buckets, Azure Blob containers, Google Cloud Storage buckets — holds objects addressed by key, with the data and its metadata alongside; the interface is HTTP verbs on a URL, which is the REST style from Unit 2.4 used as a storage API. EBS is block storage and EFS is file storage.'
    },
    {
      q: 'Why does object storage suit write-once, read-many data?',
      options: [
        'Because objects cannot be deleted',
        'Because operations are PUT, GET and DELETE on whole objects, so an object is replaced entire rather than modified in place',
        'Because it has no replication',
        'Because it requires a file system driver'
      ],
      answer: 1,
      explanation: 'Object storage has no open/read/write/seek — an object is replaced whole — which is the GFS and HDFS access pattern, and for the same reason: it removes most concurrent-modification problems by construction. Deleting and overwriting are possible, which is why versioning matters.'
    },
    {
      q: 'What is the difference between durability and availability for object storage?',
      options: [
        'They are the same property measured in different units',
        'Durability is the probability the data survives; availability is the probability you can reach it now',
        'Durability applies to block storage only',
        'Availability is guaranteed by versioning'
      ],
      answer: 1,
      explanation: 'AWS documents S3 as designed for 99.999999999% (eleven nines) durability in standard storage — a statement about the data surviving — while availability is about being able to read it at a given moment. Questions often use the terms interchangeably, so define them.'
    },
    {
      q: 'Which AWS service is the block-storage counterpart to S3\'s object storage?',
      options: [
        'SimpleDB',
        'EBS — Elastic Block Store',
        'Lambda',
        'CloudFront'
      ],
      answer: 1,
      explanation: 'The course\'s reference book names EC2, S3, EBS (Elastic Block Store) and SimpleDB together. EBS volumes attach to instances and are formatted with a file system by the guest OS, unlike S3 buckets which are reached by HTTP API.'
    },
    {
      q: 'Which virtual machine monitor does Amazon EC2 use?',
      options: [
        'VMware ESXi',
        'Microsoft Hyper-V',
        'Xen',
        'VirtualBox'
      ],
      answer: 2,
      explanation: 'Amazon\'s EC2 uses Xen as the virtual machine monitor, and that the same VMM is used in IBM\'s Blue Cloud. It also notes EC2 provides predefined VM templates users can choose from, while Blue Cloud provides none.'
    },
    {
      q: 'Which EC2 purchasing model is right for a steady, predictable load?',
      options: [
        'On-demand per second',
        'Reserved capacity with a one- or three-year commitment at a large discount',
        'Spot instances',
        'Preemptible VMs'
      ],
      answer: 1,
      explanation: 'On-demand is for variable or short work; reserved purchases fit a steady baseline; spot instances (Google\'s equivalent is preemptible VMs) use spare capacity at a deep discount but can be reclaimed by the provider, so they suit interruptible work.'
    },
    {
      q: 'Which statement about AWS Lambda is correct?',
      options: [
        'It keeps a server running and bills per hour',
        'It runs code in response to events, bills per invocation and execution duration, and scales automatically per request',
        'It requires the customer to patch the operating system',
        'It is a managed database service'
      ],
      answer: 1,
      explanation: 'Serverless means there is no server to boot, size or pay for: the code runs in response to an event, billing is per invocation and duration, scaling is automatic and per request, and functions are stateless between invocations — so state lives in storage or a managed database.'
    },
    {
      q: 'Google\'s serverless compute service is:',
      options: [
        'GCE',
        'Cloud Functions',
        'GKE',
        'Persistent Disk'
      ],
      answer: 1,
      explanation: 'The mapping is Compute Engine (GCE) for virtual machines, Cloud Functions for serverless and GKE for Kubernetes; Persistent Disk is block storage. The equivalents on the other platforms are EC2/Lambda/EKS and Azure Virtual Machines/Functions/AKS.'
    },
    {
      q: 'Why do all three major cloud platforms now offer virtual machines, containers and serverless functions?',
      options: [
        'Because a regulator requires it',
        'Because the services are APIs, and an API that becomes widely used becomes a de facto standard the others must match',
        'Because virtual machines became obsolete',
        'Because containers cannot run on virtual machines'
      ],
      answer: 1,
      explanation: 'Once one provider defines a useful interface — object storage buckets, instances with images and disks, containers with an orchestrator, functions invoked by events — the others must offer an equivalent or lose the customer\'s application. That is also why the concepts transfer between providers while the management APIs, identity model and proprietary services do not.'
    },
    {
      q: 'What are regions and availability zones used for?',
      options: [
        'To reduce the price of storage',
        'To place replicas across isolated fault domains so one zone\'s failure is survivable',
        'To define which programming languages are supported',
        'To route traffic to the nearest database'
      ],
      answer: 1,
      explanation: 'A region is a geographic area and an availability zone is an isolated set of data centres within it. Placing replicas across zones applies Unit 1\'s independent-failures characteristic as a design rule — the same reasoning as HDFS block replication across physically separate machines in Unit 4.'
    },
    {
      q: 'A managed database service (DBaaS) differs from running a database on a rented virtual machine because:',
      options: [
        'It cannot be backed up',
        'The provider handles replication, patching, backup and failover',
        'It does not support SQL',
        'It runs only in the public cloud'
      ],
      answer: 1,
      explanation: 'Database as a Service provides access to a database platform through the cloud, and public cloud providers like AWS and Azure have DBaaS offerings. A database on a rented VM is IaaS plus your own administration; the managed service takes over the operational work.'
    }
  ],

  past: [
    {
      year: '2025 (expected)',
      marks: '5',
      repeats: 1,
      q: 'Differentiate between Object Storage and Block Storage in cloud computing.',
      occ: [
        { year: '2025 (expected)', marks: '5', q: 'Differentiate between Object Storage and Block Storage in cloud computing.' }
      ],
      answer: `
<h4>Model answer &mdash; 5 marks</h4>
<p>These are the two storage abstractions a cloud offers, and they differ in the unit of
addressing and in what the store knows about the data.</p>
<table class="comparison-table">
<tr><th>Aspect</th><th>Block storage</th><th>Object storage</th></tr>
<tr><td>Unit</td><td>A fixed-size block, addressed by number</td><td>A whole object (data plus metadata plus an id), addressed by key</td></tr>
<tr><td>Seen by the client as</td><td>A raw volume &mdash; a disk, so you format it and mount a file system</td><td>An HTTP-accessible bucket of keys &mdash; no file system</td></tr>
<tr><td>Metadata</td><td>None beyond the block; meaning lives in the file system above it</td><td>Rich per-object metadata, which makes search and lifecycle rules possible</td></tr>
<tr><td>Edits</td><td>In place, at block granularity</td><td>Whole-object; a change writes a new version</td></tr>
<tr><td>Scale</td><td>Bounded by the volume; must be attached to one instance</td><td>Effectively unbounded; reached over the network from anywhere</td></tr>
<tr><td>Typical use</td><td>Database files, boot volumes, anything needing low-level I/O</td><td>Images, backups, logs, static assets, data lakes</td></tr>
<tr><td>Example</td><td>AWS EBS</td><td>AWS S3</td></tr>
</table>
<p>The deciding question is whether the workload needs to <em>write in place at low level</em>:
if yes, block; if it stores whole things and reads them back, object, which is cheaper and
scales further but cannot host a database.</p>
<div class="concept-box tip">
<h4>Marking this one</h4>
<p>Predicted, and the weakest-sourced of the set &mdash; the previous site labels it only
“Expected”. It sits in Unit 7's part of the syllabus (cloud platforms and services),
which is the unit with no lecture deck, so this card is written from the reference decks and
the textbooks like the rest of the unit.</p>
</div>
`
    },
  ]
};
