/* Chapter 6 — Virtualization and Cloud Architecture.

   Syllabus unit 6: 6 hours, 8 marks. Sub-topics 6.1 Basics of virtualization:
   Hypervisors (Type I & II), 6.2 Virtual Machines vs Containers, 6.3 Cloud
   reference architecture, 6.4 Resource management and provisioning.

   Written from Er. Avijit Karn's 47-slide Chapter 6 deck, read into
   `_source/dcc/lecture_notes_all_chapterwise_ch6_virtlzn_cloud_ref_arch_resrcprovsnmgmt.txt`
   by tools/dcc_extract.py. This is the deck with the most content inside its
   slide pictures — 41 of its 47 slides carry text in images — so the recovered
   picture text is what the definitions of the six virtualization types, the
   Type I / Type II comparison, the NoHype slide and the three provisioning
   methods below are written from.

   One block does not come from that deck. The Popek and Goldberg condition in CPU virtualization — the two classes of sensitive instruction, the definition of a
   privileged instruction, the condition itself (a processor architecture lends
   itself to virtualization if all sensitive instructions are privileged
   instructions) and the seventeen sensitive-but-unprivileged x86 instructions,
   LAR and LSL among them — is read from the two reference texts, which state the
   1974 requirement in full. Er. Karn's deck has the three categories of
   instruction and the x86 problem, but never names the paper or the condition,
   so the notes name it and the sourcing stays here rather than on the page.

   Model Question 2025, Group B question 11 (hypervisor Type I versus Type II,
   4 marks) is answered in Type I versus Type II; Unit 9's cloud-native question builds on the
   containers material in 6.2. */

window.CHAPTERS = window.CHAPTERS || {};
window.CHAPTERS[6] = {
  learn: `

<h2>Unit 6 &mdash; Virtualization and Cloud Architecture</h2>
<p class="unit-meta">Syllabus: 6 hours &middot; 8 marks &middot; sub-topics 6.1&ndash;6.4</p>

<h2>6.1 Basics of virtualization: Hypervisors (Type I & II)</h2>

<h3>The definition, and why it is the foundation of cloud computing</h3>
<div class="concept-box key">
<p>Virtualization is the ability to run multiple operating systems on a single physical system and share the underlying hardware resources. It is the process by which one computer hosts the appearance of many computers.</p>
<p>Virtualization is used to improve IT throughput and costs by using physical resources as a pool from which virtual resources can be allocated.</p>
</div>

<p>Every defining attribute of cloud computing follows from this sentence. <strong>Elasticity</strong> is possible because a virtual machine can be created or destroyed on demand instead of a physical one being bought. <strong>Pay-per-usage</strong> is possible because resources can be metered per virtual machine. Multiplexing and higher utilisation are possible because several guests share one box. <strong>A single administrative domain</strong> becomes meaningful because the pool of resources is virtual rather than a room of heterogeneous machines. Virtualization is one reason cloud computing became possible.</p>

<p>The architecture is a stack: a physical box, a virtualization platform (Xen, KVM, VMware), and above it the virtual systems. A virtual machine (VM) is an isolated runtime environment comprising a guest OS and its applications, and multiple virtual systems can run on a single physical system.</p>
<h3>The six kinds of virtualization</h3>
<p>Virtualization divides into six types, named here with one line each:</p>
<table class="comparison-table">
<thead>
<tr><th>Type</th><th>What is virtualized</th><th>How it works</th></tr>
</thead>
<tbody>
<tr><td><strong>Application</strong></td><td>The application, from the machine it appears to run on.</td><td>App runs from a server, accessed remotely.<span class="muted">The server holds all personal information and other characteristics of the application, but the application can still run on a local workstation through the internet, and it can run from a separate computer from the one on which it is installed. Apps are delivered from a server to an end user's computer, and for the user the experience of the virtualized app is the same as using the installed app on a physical machine.</span></td></tr>
<tr><td><strong>Network</strong></td><td>Networks: separate control and data planes.</td><td>Multiple virtual networks co-exist on one physical network.<span class="muted">Each has a separate control and data plane and can be managed by individual parties that are potentially confidential to each other. Logical switches, routers, firewalls, load balancers, VPNs and workload security can be created, making them operate as single or multiple independent networks.</span></td></tr>
<tr><td><strong>Desktop</strong></td><td>The desktop environment and its applications.</td><td>Separates desktop environments from client devices.<span class="muted">Lets a user access their desktop virtually from any location on a different machine. Users who need an OS other than Windows Server need a virtual desktop, and it centralises management of software installation, updates and patches in the data centre.</span></td></tr>
<tr><td><strong>Storage</strong></td><td>Physical storage devices.</td><td>Aggregates physical storage into a single virtual pool.<span class="muted">Managed from a central console, servers are not aware of exactly where their data is stored and function more like worker bees in a hive. The technology relies on software to identify available capacity from physical devices and aggregate it into a pool used by traditional architecture servers or by VMs.</span></td></tr>
<tr><td><strong>Server</strong></td><td>One physical server into several isolated servers.</td><td>Divides a physical server into multiple isolated virtual servers.<span class="muted">Creating unique and isolated virtual servers by means of a software application, each able to run its own operating system independently &mdash; a masking of server resources in which the central physical server is divided into multiple virtual servers by changing the identity number and processors, each operating its own OS in isolation. Each sub-server knows the identity of the central server, and it increases performance and reduces operating cost by deploying main-server resources into sub-server resources. It is beneficial in virtual migration, reducing energy consumption and reducing infrastructural cost.</span></td></tr>
<tr><td><strong>Data</strong></td><td>Data from many sources, presented as one view.</td><td>Collects and manages data from various sources in a single place.<span class="muted">Managed without knowing the technical detail of how it is collected, stored or formatted, then arranged logically so its virtual view can be accessed remotely by interested people, stakeholders and users through cloud services. Large vendors provide it (Oracle, IBM, CData), and its tasks include data integration, business integration, service-oriented-architecture data services and searching organisational data.</span></td></tr>
</tbody>
</table>
<h3>The hypervisor</h3>
<p>A hypervisor &mdash; also called a virtual machine manager/monitor (VMM), or virtualization manager &mdash; is a program that allows multiple operating systems to share a single hardware host. The mechanism: each guest operating system appears to have the host's processor, memory and other resources all to itself. The hypervisor controls the host processor and resources, allocating what is needed to each operating system in turn, and making sure the guest operating systems (the virtual machines) cannot disrupt each other.</p>

<p>It supports hardware-level virtualization on bare-metal devices such as CPU, memory, disk and network interfaces, and the hypervisor software sits directly between the physical hardware and its OS. This virtualization layer is referred to as either the VMM or the hypervisor, and it provides hypercalls for the guest OSes and applications.</p>

<p>First, the illusion is <strong>bidirectional</strong>: each guest sees the processor, memory and devices <em>as its own</em>, and the hypervisor is what keeps that belief safe by allocating the real resources in turn. Second, the word <strong>isolation</strong> does the commercial work &mdash; guest operating systems "cannot disrupt each other" is exactly what allows a provider to sell slices of one machine to unrelated customers. The security property and the business model are the same sentence (the management characteristic, and the shared-responsibility question). Third, the <strong>hypercall</strong> interface is the only door between a guest and the hardware, which makes the hypervisor both a layer of protection and a single point of attack.</p>

<h3>Type I versus Type II</h3>
<p>Type I &mdash; also written Type 1, or bare-metal &mdash; sits on the hardware; Type II (Type 2) is hosted, and runs as an application inside an operating system. The whole distinction is one layer:</p>

<table class="comparison-table">
<thead>
<tr><th></th><th>Type I</th><th>Type II</th></tr>
</thead>
<tbody>
<tr><td><strong>Where it runs</strong></td><td>Directly on the underlying host system.<span class="muted">It does not require any base server operating system.</span></td><td>Runs as an application in a host system.<span class="muted">It does not run directly over the underlying hardware; it runs as an application in a physical machine.</span></td></tr>
<tr><td><strong>Other names</strong></td><td><strong>Native hypervisor</strong><span class="muted">or bare-metal hypervisor.</span></td><td><strong>Hosted hypervisor.</strong></td></tr>
<tr><td><strong>Hardware access</strong></td><td>Direct access to hardware resources.</td><td>Reaches hardware through the host OS.<span class="muted">Adding a layer and its overhead.</span></td></tr>
<tr><td><strong>Typical use</strong></td><td>Servers and data centres.<span class="muted">The case for cloud computing, where the hypervisor is the platform the cloud is built on.</span></td><td>Desktop and development use.<span class="muted">Where a user runs a second OS inside their existing one.</span></td></tr>
<tr><td><strong>Examples</strong></td><td>Xen, KVM, VMware ESXi.<span class="muted">Xen is used by Amazon EC2 and IBM Blue Cloud.</span></td><td>VMware Workstation, Oracle VirtualBox.</td></tr>
</tbody>
</table>

<p>A Type I hypervisor sits on the bare machine with guests above it and no host operating system underneath. A Type II hypervisor is an application inside a host OS, so a guest's I/O passes through two operating systems on the way to a disk. Everything else follows from that one fact &mdash; direct hardware access and native names for Type I, drivers and user experience supplied by the host for Type II, data centres against desktops. The two are the same function, one layer apart.</p>
<figure class="figure-wide figure-wrap">
<svg class="figure wide" viewBox="0 0 780 320" role="img" aria-label="Type I hypervisor runs directly on the hardware with guest operating systems above it; Type II hypervisor runs as an application on a host operating system, with guest operating systems above that">
<defs><marker id="f6a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="flow-arrow-head"/></marker></defs>

<text class="flow-label" x="200" y="26" text-anchor="middle">Type I &mdash; native / bare metal</text>
<rect class="flow-box phase1" x="60" y="44" width="130" height="40" rx="8"/><text class="flow-text" x="125" y="69">Guest OS 1</text>
<rect class="flow-box phase1" x="210" y="44" width="130" height="40" rx="8"/><text class="flow-text" x="275" y="69">Guest OS 2</text>
<rect class="flow-box phase2" x="60" y="108" width="280" height="46" rx="9"/>
<text class="flow-text" x="200" y="136">Hypervisor (VMM)</text>
<rect class="flow-box phase4" x="60" y="178" width="280" height="44" rx="9"/>
<text class="flow-text" x="200" y="205">Physical hardware</text>
<text class="flow-label" x="200" y="250" text-anchor="middle">No host OS between the hypervisor and the hardware.</text>
<text class="flow-label" x="200" y="272" text-anchor="middle">Direct access to CPU, memory, disk and NIC.</text>

<text class="flow-label" x="580" y="26" text-anchor="middle">Type II &mdash; hosted</text>
<rect class="flow-box phase1" x="440" y="44" width="130" height="40" rx="8"/><text class="flow-text" x="505" y="69">Guest OS 1</text>
<rect class="flow-box phase1" x="590" y="44" width="130" height="40" rx="8"/><text class="flow-text" x="655" y="69">Guest OS 2</text>
<rect class="flow-box phase2" x="440" y="108" width="280" height="46" rx="9"/>
<text class="flow-text" x="580" y="136">Hypervisor (an application)</text>
<rect class="flow-box phase3" x="440" y="178" width="280" height="44" rx="9"/>
<text class="flow-text" x="580" y="205">Host operating system</text>
<text class="flow-label" x="580" y="250" text-anchor="middle">The guest pays for the host OS layer above the</text>
<text class="flow-label" x="580" y="272" text-anchor="middle">hardware, but the host OS provides the device drivers.</text>
</svg>
<figcaption>Fig 6.1 &mdash; The two hypervisor types. The difference is one layer: a Type I hypervisor replaces the host operating system, a Type II hypervisor runs on top of it. That single layer is why data centres use Type I (performance, direct hardware access, no host OS to attack or patch) and desktops use Type II (the host OS supplies the drivers and the user experience).</figcaption>
</figure>
<h3>The roles of a hypervisor</h3>
<p>Five responsibilities, one per virtualized resource:</p>
<ul>
<li>Isolating and emulating resources &mdash; the general responsibility.</li>
<li><strong>CPU</strong> &mdash; <strong>scheduling virtual machines.</strong></li>
<li><strong>Memory</strong> &mdash; <strong>managing memory.</strong></li>
<li><strong>I/O</strong> &mdash; <strong>emulating I/O devices.</strong></li>
<li><strong>Networking</strong>, and managing virtual machines.</li>
</ul>
<p>CPU has to decide how much of a real processor each guest gets and in what order, which is a scheduling problem with a fairness question attached (efficient VM provisioning). Memory has to give each guest a private address space that it believes is the whole machine, which cannot be done with one page table &mdash; hence the two-stage mapping below. I/O and networking have to <em>emulate devices the guest expects to find</em>, because an unmodified operating system looks for a disk controller and a network card and will not boot without one. That emulation is why a VM's I/O is the slowest thing it does, and why pass-through devices exist. Managing virtual machines is the odd one out in the list: it is the provider's side of the same layer &mdash; starting, stopping, snapshotting and migrating guests.</p>

<h3>CPU virtualization</h3>
<p>A VM is a duplicate of an existing computer system in which the majority of the VM's instructions are executed on the host processor in native mode, so unprivileged instructions of VMs run directly on the host machine for higher efficiency. The sensitive instructions are the rest, and they fall into three categories:</p>
<table class="comparison-table">
<thead>
<tr><th>Category</th><th>Definition</th></tr>
</thead>
<tbody>
<tr><td><strong>Privileged instructions</strong></td><td>Execute in a privileged mode.<span class="muted">Will be trapped if executed outside this mode.</span></td></tr>
<tr><td><strong>Control-sensitive instructions</strong></td><td>Attempt to change the configuration.<span class="muted">Of resources used.</span></td></tr>
<tr><td><strong>Behavior-sensitive instructions</strong></td><td>Have different behaviours depending on the configuration.<span class="muted">Of resources, including the load and store operations over the virtual memory.</span></td></tr>
</tbody>
</table>
<p>A CPU architecture is virtualizable if it supports the ability to run the VM's privileged and unprivileged instructions in the CPU's user mode while the VMM runs in supervisor mode. When those privileged, control-sensitive and behaviour-sensitive instructions are executed by a VM they are <strong>trapped in the VMM</strong>, and the VMM acts as a unified mediator for hardware access from different VMs to guarantee the correctness and stability of the whole system.</p>
<h4>The Popek and Goldberg condition</h4>
<p>The three categories come from the formal requirements Popek and Goldberg set out in 1974 for a machine to be virtualizable. Two classes of instruction are the whole argument:</p>
<ul>
<li><strong>Control-sensitive</strong> &mdash; an instruction that may change the configuration of the machine: something that moves the memory offset held in a relocation register, or that edits the interrupt table holding the pointers to interrupt handlers.</li>
<li><strong>Behaviour-sensitive</strong> &mdash; an instruction whose effect is partly decided by the context it runs in. The example is the POPF instruction on x86, which sets the interrupt-enable flag <em>only</em> when it runs in system mode, so the same instruction does two different things depending on which mode the guest believes it is in.</li>
</ul>
<p>An instruction is <em>privileged</em> if executing it in user mode causes a trap, and every other instruction is unprivileged. With those definitions the requirement is one sentence:</p>
<div class="formula-box">
<span class="fb-label">Popek and Goldberg condition</span>
A processor architecture lends itself to virtualization if all sensitive instructions are privileged instructions.
</div>
<p>Why that is the condition rather than a preference: a hypervisor's only enforcement mechanism is the trap. A sensitive instruction that is privileged can be trapped and handled by the VMM, so the guest can be stopped from changing the machine's configuration, and from discovering that it is not on a real machine. A sensitive instruction that is <em>not</em> privileged runs to completion inside the guest and cannot be intercepted at all &mdash; so the guest either breaks its neighbours or discovers the illusion. x86 is the famous case of an architecture that fails the condition: seventeen x86 instructions are sensitive but not privileged, among them LAR (load access rights) and LSL (load segment limit).</p>

<div class="concept-box warn">
<h4>What x86 does instead</h4>
<p>Not all CPU architectures are virtualizable. RISC architectures can be naturally virtualized, because all control- and behaviour-sensitive instructions are privileged instructions &mdash; so trapping is enough. On the contrary, x86 CPU architectures were not primarily designed to support virtualization, because some sensitive instructions were not privileged and therefore did not trap. That is why x86 virtualization needed either binary translation, paravirtualization (as in Xen's original design) or, later, hardware-assisted virtualization extensions. </p>
</div>

<h3>Memory virtualization</h3>
<p>Virtual memory virtualization is similar to the virtual memory support provided by modern operating systems. In a traditional execution environment, the operating system maintains mappings of virtual memory to machine memory using page tables &mdash; a one-stage mapping from virtual memory to machine memory. Modern x86 CPUs include a <strong>memory management unit (MMU)</strong> and a <strong>translation lookaside buffer (TLB)</strong> to optimise it.</p>
<p>In a virtual execution environment things change: virtual memory virtualization involves sharing the physical system memory in RAM and dynamically allocating it to the physical memory of the VMs, and a two-stage mapping process must be maintained by the guest OS and the VMM respectively:</p>
<div class="formula-box lines">
<span class="fb-label">Two-Stage Memory Mapping</span>
Stage 1: Guest OS maps Virtual Address (VA) &rarr; Physical Address (PA)
Stage 2: VMM maps Physical Address (PA) &rarr; Machine Address (MA)
</div>
<figure class="figure-wide figure-wrap">
<svg class="figure wide" viewBox="0 0 760 300" role="img" aria-label="Two-level memory mapping: two virtual machines each map their processes' virtual addresses to guest physical addresses, and the VMM maps guest physical addresses to machine addresses on the physical hardware">
<defs><marker id="f6b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="flow-arrow-head"/></marker></defs>

<rect class="flow-box phase1" x="30" y="40" width="90" height="36" rx="8"/><text class="flow-label" x="75" y="63" text-anchor="middle">Process 1</text>
<rect class="flow-box phase1" x="30" y="90" width="90" height="36" rx="8"/><text class="flow-label" x="75" y="113" text-anchor="middle">Process 2</text>
<rect class="flow-box phase1" x="170" y="40" width="90" height="36" rx="8"/><text class="flow-label" x="215" y="63" text-anchor="middle">Process 1</text>

<rect class="flow-box phase2" x="300" y="60" width="110" height="46" rx="9"/><text class="flow-text" x="355" y="88">VM 1</text>
<rect class="flow-box phase2" x="300" y="140" width="110" height="46" rx="9"/><text class="flow-text" x="355" y="168">VM 2</text>

<rect class="flow-box phase3" x="500" y="60" width="140" height="46" rx="9"/><text class="flow-text" x="570" y="82">Guest physical</text><text class="flow-text" x="570" y="100">address (PA)</text>
<rect class="flow-box phase4" x="500" y="140" width="140" height="46" rx="9"/><text class="flow-text" x="570" y="162">Machine address</text><text class="flow-text" x="570" y="180">(MA)</text>

<rect class="flow-box phase4" x="300" y="215" width="340" height="34" rx="8"/>
<text class="flow-text" x="470" y="237">Physical hardware &mdash; RAM, MMU, TLB</text>

<path class="flow-arrow" d="M124,58 H166" marker-end="url(#f6b)"/>
<text class="flow-label" x="145" y="132" text-anchor="middle">VA</text>
<path class="flow-arrow" d="M264,58 C284,58 286,80 296,82" marker-end="url(#f6b)"/>
<path class="flow-arrow" d="M264,98 C284,98 286,158 296,162" marker-end="url(#f6b)"/>
<path class="flow-arrow" d="M414,80 H496" marker-end="url(#f6b)"/>
<path class="flow-arrow" d="M414,160 H496" marker-end="url(#f6b)"/>
<text class="flow-label" x="455" y="60" text-anchor="middle">stage 1</text>
<path class="flow-arrow" d="M570,110 V136" marker-end="url(#f6b)"/>
<text class="flow-label" x="636" y="128" text-anchor="middle">stage 2 (VMM)</text>
<path class="flow-arrow" d="M570,190 V211" marker-end="url(#f6b)"/>

<text class="flow-label" x="380" y="272" text-anchor="middle">Stage 1 &mdash; the guest OS maps its processes' virtual addresses to the VM's physical memory.</text>
<text class="flow-label" x="380" y="292" text-anchor="middle">Stage 2 &mdash; the VMM maps that guest physical memory to real machine memory.</text>
</svg>
<figcaption>Fig 6.2 &mdash; Two-level (nested) memory mapping. The one-stage mapping of a traditional OS becomes two stages, because the guest OS can only be allowed to manage memory it has been given &mdash; it must not know about, or be able to address, the rest of the machine. The extra translation is the reason memory virtualization costs performance, which is what hardware-assisted techniques (such as nested page tables) recover.</figcaption>
</figure>

<p>Why the second stage is needed follows from the isolation rule of the hypervisor. The guest OS must be allowed to page its own processes without being able to name, or even discover, memory belonging to another guest or to the hypervisor. Its page tables may therefore only ever map guest physical addresses, and the VMM owns the mapping from there to real machine memory. The price is one extra translation on every memory access, which is why hardware support exists for it: <strong>nested page tables</strong> (Intel EPT, AMD RVI) let the processor walk both levels without trapping to the hypervisor, and the TLB caches the result. Memory virtualization costs performance because of two lookups where a physical machine does one &mdash; and the mitigation is the pattern for CPU and I/O as well: do less in software and let the hardware do more.</p>

<h3>I/O virtualization</h3>
<p>Three approaches, and the trade-off between them:</p>
<table class="comparison-table">
<thead>
<tr><th>Approach</th><th>How it works</th><th>Trade-off</th></tr>
</thead>
<tbody>
<tr><td><strong>Full device emulation</strong></td><td>Emulates well-known, real-world devices: all the functions of a device or bus infrastructure &mdash; device enumeration, identification, interrupts and DMA &mdash; are replicated in software, and that software is located in the VMM and acts as a virtual device. The guest OS's I/O access requests are trapped in the VMM, which interacts with the I/O devices.</td><td>Compatible with unmodified guests, but requires a very high overhead of device emulation.</td></tr>
<tr><td><strong>Direct I/O</strong></td><td>Lets the VM access devices directly, achieving close-to-native performance without high CPU costs.</td><td>Current implementations focus on networking for mainframes, and there are many challenges for commodity hardware devices. For example, when a physical device is reclaimed for later reassignment because of workload migration, it may have been left in an arbitrary state &mdash; DMA to some arbitrary memory location, say &mdash; which can function incorrectly or crash the whole system.</td></tr>
<tr><td><strong>Hardware-assisted</strong></td><td>Support in the hardware for the remapping and isolation that emulation was doing in software.</td><td>Software-based I/O virtualization carries a very high overhead of device emulation, so hardware-assisted I/O virtualization is critical.</td></tr>
</tbody>
</table>
<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s24-098.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s24-098.webp" alt="What the virtual device does: it remaps guest and real I/O addresses, multiplexes and drives the physical device, and adds I/O features such as copy-on-write disks." width="1122" height="630" loading="lazy" decoding="async">
<figcaption>What the virtual device does: it remaps guest and real I/O addresses, multiplexes and drives the physical device, and adds I/O features such as copy-on-write disks.</figcaption>
</figure>
<!-- /dcc-fig -->
<h3>The Xen architecture</h3>
<p>Xen is an open-source hypervisor program developed by Cambridge University. It is a micro-kernel hypervisor which separates the policy from the mechanism: the Xen hypervisor implements all the mechanisms, leaving the policy to be handled by Domain 0. Xen does not include any device drivers natively &mdash; it just provides a mechanism by which a guest OS can have direct access to the physical devices. As a result the size of the Xen hypervisor is kept rather small, and it provides a virtual environment located between the hardware and the OS. The core components of a Xen system are the hypervisor, the kernel and the applications.</p>
<p>The domain distinction: the guest OS that has control ability is called Domain 0, and the others are called Domain U. Domain 0 is a privileged guest OS; it is first loaded when Xen boots, without any file-system drivers being available, and it is designed to access hardware directly and manage devices. Therefore one of its responsibilities is to allocate and map hardware resources for the guest domains (the Domain U domains).</p>
<h3>Benefits of virtualization</h3>
<p>Five benefits, each a cloud property restated at the machine level:</p>
<table class="comparison-table">
<thead>
<tr><th>Benefit</th><th>The statement</th><th>What it enables in the cloud</th></tr>
</thead>
<tbody>
<tr><td><strong>Sharing of resources</strong></td><td>Helps <strong>cost reduction</strong>.</td><td>The multiplexing that makes pay-per-usage economical.</td></tr>
<tr><td><strong>Isolation</strong></td><td>Virtual machines are isolated from each other as if they were physically separated.</td><td>Multi-tenancy: one provider serves customers who do not trust each other.</td></tr>
<tr><td><strong>Encapsulation</strong></td><td>A VM encapsulates a complete computing environment.</td><td>Templates and images: a whole machine becomes one file that can be copied.</td></tr>
<tr><td><strong>Hardware independence</strong></td><td>VMs run independently of the underlying hardware.</td><td>Portability across a provider's fleet, and no vendor-specific hardware lock-in.</td></tr>
<tr><td><strong>Portability</strong></td><td>VMs can be migrated between different hosts.</td><td><strong>Live migration</strong>, which is what makes maintenance and load balancing invisible &mdash; and what 6.4 assumes.</td></tr>
</tbody>
</table>

<p>The five are not five separate advantages; they are one mechanism seen five times. Isolation is what makes multi-tenancy possible, so it is why a public cloud can exist at all. Encapsulation is what makes a machine <em>portable as data</em> &mdash; a whole computing environment in one file &mdash; which is how templates, images and snapshots work. Hardware independence is what stops a workload from being tied to a particular server, so capacity can be added anywhere in a fleet. Portability plus encapsulation is what lives behind live migration, the technique that lets a provider patch or rebalance a host without a customer noticing, and therefore the reason availability can be promised in a contract. Sharing comes first because it is the money: the same physical machine earns from many tenants.</p>

<h3>Hypervisor vulnerabilities, and NoHype</h3>
<p class="prereq-note">Outside the syllabus &mdash; 6.1 is the basics of virtualization and the two hypervisor types. NoHype is one research answer to the hypervisor's own attack surface; the vulnerabilities are covered in 8.4.</p>
<div class="concept-box warn">
<h4>Single Point of Attack</h4>
<p>The security consequence is architectural: since the hypervisor sits between every guest and the hardware, it is a single point of attack that can see every guest. The threat &mdash; malicious software can run on the same server, attack the hypervisor, and access or obstruct other VMs &mdash; is the reasoning behind the multi-tenancy risk, and the word for it is <em>VM escape</em>.</p>
</div>
<p>One research answer, <strong>NoHype</strong>: it removes the hypervisor &mdash; there is nothing to attack. It is <strong>a complete systems solution</strong> that still retains the needs of a virtualized cloud infrastructure (the reference is Keller, Szefer, Rexford and Lee, <em>NoHype: Virtualized Cloud Infrastructure without the Virtualization</em>, ISCA 2010). The trade-off it exposes is this: the isolation the hypervisor provides is also the isolation it must be trusted to provide, and removing it means proving the hardware can do the job instead.</p>

<h2>6.2 Virtual Machines vs Containers</h2>

<h3>What a virtual machine is</h3>
<p>A virtual machine (VM) is best described as a software program that emulates the functionality of physical hardware or a computing system. It runs on top of emulating software called the hypervisor, which replicates the functionality of the underlying physical hardware resources in a software environment. Those resources may be referred to as <strong>the host machine</strong>, while the VM that runs on the hypervisor is often called a guest machine.</p>
<p>The VM contains all the elements necessary to run its applications: storage, memory, networking, and hardware functionality available as a virtualized system. It may also contain the necessary system binaries and libraries &mdash; but the actual operating system is managed and executed using the hypervisor. The idea is to create a small layer between the hardware and the operating system that performs this abstraction, called the hypervisor.</p>
<p>Three terms, kept apart: the <strong>host machine</strong> is the physical hardware, the <strong>guest</strong> is the VM running on it, and the hypervisor is the layer in between. A VM carries everything needed to run its applications, including the system binaries and libraries, and the only thing it does not own is the operating system kernel, which the hypervisor executes for it. That is also the property that makes a VM heavy: a guest usually runs a complete operating system of its own. That is where containers take a different decision, and it is why a VM image is measured in gigabytes where a container image is measured in megabytes.</p>
<h3>What a container is</h3>
<p>Containerization creates abstraction at an OS level that allows individual, modular and distinct functionality of the app to run independently, so that several isolated workloads &mdash; the containers &mdash; can dynamically operate using the same physical resources. A simpler definition: a container is a unit of software that is lightweight but still bundles the code, its dependencies and the configuration altogether into a single image. Containers can run on top of bare-metal servers, on top of hypervisors, or in cloud infrastructure.</p>
<div class="concept-box key">
<h4>The one difference that defines containers</h4>
<p>Containers share all the necessary capabilities with a VM to operate as an isolated OS environment for a modular app's functionality, with one key difference. Using a containerization engine such as the Docker Engine, containers create several isolated OS environments within the same host system kernel, which can be shared with other containers dedicated to running different functions of the application. Only binaries, libraries and other runtime components are developed or executed separately for each container, which makes them more resource-efficient compared to VMs. The idea is to virtualize the layers above the host OS &mdash; instead of giving every application its own operating system, give it its own user space above one shared kernel.</p>
</div>
<figure class="figure-wide figure-wrap">
<svg class="figure wide" viewBox="0 0 800 330" role="img" aria-label="Side by side stacks: in the virtual machine model each application has its own guest operating system above the hypervisor; in the container model applications share the host operating system and the container engine">
<defs><marker id="f6c" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="flow-arrow-head"/></marker></defs>

<text class="flow-label" x="215" y="24" text-anchor="middle">Virtual machines</text>
<text class="flow-label" x="600" y="24" text-anchor="middle">Containers</text>

<rect class="flow-box phase1" x="60" y="40" width="110" height="34" rx="7"/><text class="flow-label" x="115" y="62" text-anchor="middle">App A</text>
<rect class="flow-box phase1" x="180" y="40" width="110" height="34" rx="7"/><text class="flow-label" x="235" y="62" text-anchor="middle">App B</text>
<rect class="flow-box phase2" x="60" y="84" width="110" height="34" rx="7"/><text class="flow-label" x="115" y="106" text-anchor="middle">Bins/Libs</text>
<rect class="flow-box phase2" x="180" y="84" width="110" height="34" rx="7"/><text class="flow-label" x="235" y="106" text-anchor="middle">Bins/Libs</text>
<rect class="flow-box phase3" x="60" y="128" width="110" height="34" rx="7"/><text class="flow-label" x="115" y="150" text-anchor="middle">Guest OS</text>
<rect class="flow-box phase3" x="180" y="128" width="110" height="34" rx="7"/><text class="flow-label" x="235" y="150" text-anchor="middle">Guest OS</text>
<rect class="flow-box phase2" x="60" y="172" width="230" height="38" rx="8"/><text class="flow-label" x="175" y="196" text-anchor="middle">Hypervisor</text>
<rect class="flow-box phase4" x="60" y="222" width="230" height="38" rx="8"/><text class="flow-label" x="175" y="246" text-anchor="middle">Physical infrastructure</text>
<text class="flow-label" x="175" y="290" text-anchor="middle">Every application carries an operating system</text>
<text class="flow-label" x="175" y="310" text-anchor="middle">of its own &mdash; heavier, and fully isolated.</text>

<rect class="flow-box phase1" x="450" y="40" width="110" height="34" rx="7"/><text class="flow-label" x="505" y="62" text-anchor="middle">App A</text>
<rect class="flow-box phase1" x="570" y="40" width="110" height="34" rx="7"/><text class="flow-label" x="625" y="62" text-anchor="middle">App B</text>
<rect class="flow-box phase2" x="450" y="84" width="110" height="34" rx="7"/><text class="flow-label" x="505" y="106" text-anchor="middle">Bins/Libs</text>
<rect class="flow-box phase2" x="570" y="84" width="110" height="34" rx="7"/><text class="flow-label" x="625" y="106" text-anchor="middle">Bins/Libs</text>
<rect class="flow-box phase2" x="450" y="128" width="230" height="38" rx="8"/><text class="flow-label" x="565" y="152" text-anchor="middle">Container engine (Docker)</text>
<rect class="flow-box phase3" x="450" y="176" width="230" height="38" rx="8"/><text class="flow-label" x="565" y="200" text-anchor="middle">Host operating system</text>
<rect class="flow-box phase4" x="450" y="222" width="230" height="38" rx="8"/><text class="flow-label" x="565" y="246" text-anchor="middle">Physical infrastructure</text>
<text class="flow-label" x="565" y="290" text-anchor="middle">One shared kernel, only the user space repeated</text>
<text class="flow-label" x="565" y="310" text-anchor="middle">&mdash; lighter and faster, less isolated.</text>
</svg>
<figcaption>Fig 6.3 &mdash; Containers versus virtual machines. A VM duplicates everything above the hypervisor including the operating system; a container duplicates only the application, its binaries and its libraries, because all containers share the host system kernel.</figcaption>
</figure>
<h3>The comparison, and the costs on each side</h3>
<table class="comparison-table">
<thead>
<tr><th></th><th>Virtual machines</th><th>Containers</th></tr>
</thead>
<tbody>
<tr><td><strong>Abstraction level</strong></td><td><strong>Hardware.</strong><span class="muted">The hypervisor emulates the physical machine, so the guest sees hardware.</span></td><td><strong>Operating-system level.</strong><span class="muted">Isolated OS environments running on the same host kernel, so the container sees a user space.</span></td></tr>
<tr><td><strong>What each instance includes</strong></td><td>A full guest operating system.<span class="muted">Plus system binaries and libraries.</span></td><td>Only the code, its dependencies and its configuration.<span class="muted">In one image; only binaries, libraries and runtime components are separate per container.</span></td></tr>
<tr><td><strong>Kernel</strong></td><td>Each VM has a kernel of its own, inside its guest operating system.</td><td>All containers share the host kernel &mdash; nothing kernel-level is duplicated.</td></tr>
<tr><td><strong>Startup time</strong></td><td>Slower to start and larger on disk, because the guest operating system has to boot and the image carries a whole OS.</td><td>Quicker to start and smaller, because there is no operating system to boot and the image carries only the application, its dependencies and its configuration.</td></tr>
<tr><td><strong>Resource efficiency</strong></td><td>Larger size and less portable.</td><td><strong>More resource-efficient.</strong><span class="muted">Compared to VMs, and faster to start because there is no OS to boot.</span></td></tr>
<tr><td>Isolation and security</td><td><strong>Full isolation security.</strong><span class="muted">Separation in terms of computation, logic and storage, and the hypervisor has greater control over how much system resources each VM is allocated.</span></td><td><strong>Less secure.</strong><span class="muted">Due to sharing of the underlying operating system &mdash; Meltdown is the example. A kernel-level flaw is shared by every container on the host.</span></td></tr>
<tr><td><strong>Flexibility</strong></td><td><strong>Different guest operating systems.</strong><span class="muted">Capable of running VMs with different OSes &mdash; Windows and Linux side by side on one host.</span></td><td><strong>Same kernel.</strong><span class="muted">All containers must run atop the same kernel, and there is less flexibility with respect to hardware requirements.</span></td></tr>
<tr><td><strong>Stated advantages</strong></td><td>Separation and resource control.<span class="muted">Separation of computation, logic and storage; different guest OSes; resource control by the hypervisor; full isolation security.</span></td><td>Compartmentalisation and portability.<span class="muted">Size, ease of defining a container, versioning; a great ecosystem; and using the host kernel for allocation of resources.</span></td></tr>
</tbody>
</table>
<div class="concept-box tip">
<h4>The summary sentence</h4>
<p>Both virtualize, but at different levels. A VM virtualizes the machine, so each instance carries its own operating system and gets hardware-level isolation. A container virtualizes the operating system, so instances share one kernel and carry only their own user space, which makes them lighter and faster but less isolated. The choice is then a sentence of engineering: VMs when guests need different or untrusted kernels; containers when the workload is many copies of one stack that must start quickly.</p>
</div>

<h2>6.3 Cloud reference architecture</h2>

<p>The reference architecture is the NIST model, and it is best memorised as four layers, three cross-cutting management groups, and six actors.</p>

<h3>The provider's four layers</h3>
<table class="comparison-table">
<thead>
<tr><th>Layer</th><th>Contents</th><th>What it is</th></tr>
</thead>
<tbody>
<tr><td><strong>Service layer</strong> (also drawn as <em>service orchestration</em> above the service layer)</td><td>SaaS, PaaS, IaaS</td><td>The three delivery models, as the customer sees them.</td></tr>
<tr><td>Resource abstraction and control layer</td><td>The hypervisors, virtual machines and control software.</td><td>Where virtualization lives: it turns physical resources into the pool the service layer sells.</td></tr>
<tr><td><strong>Physical resource layer</strong></td><td>Hardware and facility.</td><td>Servers, storage and network, and the facility that houses them &mdash; power, cooling and physical security. Physical-security controls are controls on this layer.</td></tr>
<tr><td><strong>Cloud service management</strong> (a management group rather than a layer, drawn beside them)</td><td>Business support, provisioning/configuration, portability/interoperability.</td><td>The operational functions: the cloud activities. Portability/interoperability is the layer that resists vendor lock-in.</td></tr>
</tbody>
</table>
<h4>Cross-Cutting Concerns</h4>
<p><strong>Three cross-cutting concerns</strong> are drawn as vertical activities through the whole provider: security, privacy and performance &mdash; and in the fuller NIST picture, <strong>audit</strong> as well. None of the three is a layer: security is a property that the service layer, the control layer and the physical layer each have to deliver.</p>

<h3>The actors &mdash; the NIST reference model's terminology</h3>
<table class="comparison-table">
<thead>
<tr><th>Actor</th><th>Definition</th></tr>
</thead>
<tbody>
<tr><td><strong>Consumer</strong></td><td>An entity as the principal stakeholder that maintains a business relationship with the provider.</td></tr>
<tr><td><strong>Provider</strong></td><td>The entity that makes services available.</td></tr>
<tr><td><strong>Auditor</strong></td><td>A party that conducts an audit with the intent to express an opinion thereon. Audits are performed to verify conformance to standards through review of objective evidence. This is the actor that makes cloud assurance possible, and SLA verification depends on it.</td></tr>
<tr><td><strong>Broker</strong></td><td>An entity that manages the use, performance and delivery of cloud services and negotiates relationships between providers and consumers, in three forms: intermediation (adding value to a service), aggregation (combining several services) and arbitrage (balancing across providers &mdash; buying low, selling where the demand is).</td></tr>
<tr><td><strong>Developer</strong></td><td>The role that builds applications on the provider's platform.</td></tr>
<tr><td><strong>Carrier</strong></td><td>The role that provides the connectivity &mdash; the <em>network cloud services</em>.</td></tr>
</tbody>
</table>
<div class="concept-box tip">
<h4>How to draw it</h4>
<p>Draw the consumer on the left and the provider on the right, with the auditors, brokers and carriers between them. Inside the provider, stack <strong>service layer (SaaS/PaaS/IaaS)</strong> above resource abstraction and control above physical resource (hardware, facility), and put <strong>cloud service management</strong> as a column on the right of all three. Then draw security, privacy and performance as vertical bars crossing every layer.</p>
</div>

<h2>6.4 Resource management and provisioning</h2>

<h3>The provisioning problem, and the SLA tension</h3>
<div class="concept-box key">
<p>Providers supply cloud services by signing SLAs with end users, and the SLAs must commit sufficient resources &mdash; CPU, memory and bandwidth &mdash; that the user can use for a preset period. That commitment creates a two-sided error:</p>
<ul>
<li>Underprovisioning of resources will lead to broken SLAs and penalties.</li>
<li>Overprovisioning of resources will lead to resource underutilisation, and consequently a decrease in revenue for the provider.</li>
</ul>
</div>
<p>So provisioning is not a technical optimum but a commercial one, and the rest of 6.4 is about how it is done.</p>

<p>The difficulty of deploying an autonomous system to provision resources efficiently comes from five sources:</p>
<ol>
<li>The unpredictability of consumer demand.</li>
<li>Software and hardware failures.</li>
<li><strong>Heterogeneity of services</strong> &mdash; a user may take NaaS, a queue service or SaaS.</li>
<li><strong>Power management</strong>, since servers dissipate heat.</li>
<li>Conflicts in the signed SLAs between consumers and service providers.</li>
</ol>

<h3>Efficient VM provisioning</h3>
<p>Efficient VM provisioning depends on the cloud architecture and the management of cloud infrastructures. In a virtualised cluster of servers, it demands three capabilities: efficient installation of VMs, live VM migration, and fast recovery from failures. To deploy VMs, users treat them as physical hosts with customised operating systems for specific applications.</p>
<p>The concrete products:</p>
<ul>
<li><strong>Amazon's EC2</strong> (Amazon's IaaS service) uses Xen as the virtual machine monitor (VMM) &mdash; the same VMM used in <strong>IBM's Blue Cloud</strong>. In EC2, predefined VM templates are also provided, and users can choose different kinds of VMs from the templates.</li>
<li>IBM's Blue Cloud does not provide any VM templates; in general, any type of VM can run on top of Xen.</li>
<li>Microsoft also applies virtualization in its Azure cloud platform.</li>
</ul>
<p>The principle stated with them: the provider should offer resource-economic services.</p>

<h3>The three provisioning methods</h3>
<table class="comparison-table">
<thead>
<tr><th>Method</th><th>How it decides</th><th>Strength and weakness</th></tr>
</thead>
<tbody>
<tr><td><strong>Demand-driven</strong></td><td>Adds or removes computing instances based on the current utilisation level of the allocated resources. In general, when a resource has surpassed a threshold for a certain amount of time the scheme increases that resource based on demand, and when a resource is below a threshold for a certain amount of time it can be decreased accordingly. The rule in practice: define a range for CPU utilisation, say 30% to 70% &mdash; below 30% decrease CPU capacity, above 70% increase it. Amazon implements such an auto-scale feature in its EC2 platform.</td><td><strong>Easy to implement</strong>, and the natural default. Disadvantage: the scheme does not work out right if the workload changes abruptly &mdash; by the time the threshold is crossed the capacity is already needed.</td></tr>
<tr><td><strong>Event-driven</strong></td><td>Adds or removes machine instances based on a specific time event. It works better for seasonal or predicted events such as Christmastime in the West and the Lunar New Year in the East, when the number of users grows before the event period and then decreases during it. The scheme anticipates peak traffic before it happens.</td><td>Results in a minimal loss of QoS if the event is predicted correctly. Otherwise wasted resources are even greater, due to events that do not follow a fixed pattern.</td></tr>
<tr><td><strong>Popularity-driven</strong></td><td>The Internet is searched for the popularity of certain applications and instances are created by popularity demand &mdash; currently popular applications are Facebook, Instagram and Twitter. The scheme anticipates increased traffic with popularity.</td><td>Again minimal loss of QoS if the predicted popularity is correct; resources may be wasted if traffic does not occur as expected.</td></tr>
</tbody>
</table>
<div class="concept-box warn">
<h4>Three methods, not two</h4>
<p>All three methods belong together: demand-driven (reactive, thresholds, EC2 auto-scale), event-driven (calendar-based, seasonal peaks) and popularity-driven (trend-based). The first is <em>reactive</em> and the other two are <em>predictive</em>, and both predictive ones share the same failure mode: wasted resources when the prediction is wrong.</p>
</div>
<h3>The software stack and runtime support</h3>
<p>Two closing ideas about cloud architecture. First, the <strong>software stack</strong>: it is built from scratch to meet rigorous goals. Developers must design for high throughput, high availability and fault tolerance at every layer &mdash; even the operating system might be modified to meet the special requirements of cloud data processing. The stack is layered, each layer providing an interface for the layers above it just as a traditional software stack does. However, the lower layers are not completely transparent to the upper layers, because each layer sells a different thing (SaaS shares software, PaaS shares a platform, IaaS shares hardware).</p>
<p>Second, <strong>runtime support services</strong>: as in a cluster, the cloud has cluster monitoring to collect the runtime status of the entire cluster and a scheduler that queues tasks submitted to the whole cluster and assigns them to processing nodes according to node availability. The distributed scheduler for cloud applications has special characteristics &mdash; for example scheduling programs written in MapReduce style &mdash; and the runtime support system keeps the cloud cluster working properly with high efficiency.</p>
<h3>Cloud service tasks and trends</h3>
<p class="prereq-note">Outside the syllabus &mdash; 6.4 is resource management and provisioning. The service tasks surveyed here, and the trends, are background: the trends are the subject of 9.1 to 9.4.</p>
<p>The service tasks and the trends:</p>
<ul>
<li>SaaS is the top layer, for business applications. CRM is heavily practised in business promotion, direct sales and marketing services, and CRM offered the first successful SaaS on the cloud; the approach widens market coverage by investigating customer behaviour and revealing opportunities through statistical analysis. SaaS tools also apply to <strong>distributed collaboration (Google Docs)</strong> and to financial and human-resources management, and these services have grown rapidly.</li>
<li><strong>PaaS</strong> is provided by Google, Salesforce.com and Facebook among others; <strong>IaaS</strong> by Amazon, Windows Azure and Rackspace.</li>
<li><strong>Collocation services</strong> require multiple cloud providers to work together to support supply chains in manufacturing.</li>
<li><strong>Network cloud services</strong> provide communications — the providers are AT&amp;T, Qwest and AboveNet.</li>
</ul>
<p>Two of those items carry the history. CRM being the first successful SaaS is how the delivery model arrived: the software model that pays per user per month was proved on a business application before it reached consumers. <strong>Collocation</strong> &mdash; several cloud providers working together to support one supply chain &mdash; is the earliest form of multi-cloud, and the limit of the single-provider picture: once a business depends on three clouds, the problem stops being virtualization and becomes coordination between providers. They do not share an oracle of time or a common control plane (the inter-cloud resource management topic).</p>
<p class="past-pointer">Questions on this unit, with model answers, are on the <a href="#/ch/6/past">Past Questions</a> tab.</p>
`,

  revise: {"the-definition-and-why-it-is-the-foundation-of-cloud-computing":"<p><strong>Virtualization</strong> runs multiple operating systems on a single physical system, sharing the underlying hardware.</p>\n<ul>\n<li>It is the process by which one computer hosts the appearance of many computers.</li>\n<li>Physical resources become a pool from which virtual resources are allocated, improving IT throughput and costs.</li>\n<li>A <strong>virtual machine</strong> is an isolated runtime environment comprising a guest OS and its applications.</li>\n<li>The stack is a physical box, a virtualization platform (Xen, KVM, VMware) and the virtual systems above it.</li>\n</ul>\n","the-six-kinds-of-virtualization":"<p>Six types of virtualization.</p>\n<ul>\n<li><strong>Application</strong>: the application is stored and run from a server, not the local machine.</li>\n<li><strong>Network</strong>: several virtual networks, each with a separate control and data plane, coexist on one physical network.</li>\n<li><strong>Desktop</strong>: the desktop and its applications are separated from the physical client device.</li>\n<li><strong>Storage</strong>: physical storage is aggregated into a pool that appears as one device.</li>\n<li><strong>Server</strong>: one physical server becomes several isolated virtual servers, each with its own operating system.</li>\n<li><strong>Data</strong>: many sources presented as one view.</li>\n</ul>\n","the-hypervisor":"<p>A <strong>hypervisor</strong>, also called a virtual machine manager, lets multiple operating systems share one hardware host.</p>\n<ul>\n<li>Each guest appears to have the host's processor, memory and other resources to itself.</li>\n<li>The hypervisor controls the host processor and resources, allocating what is needed to each system in turn.</li>\n<li>It makes sure the guest operating systems cannot disrupt each other.</li>\n<li>It sits directly between the physical hardware and its OS, supports hardware-level virtualization, and provides hypercalls to guests.</li>\n</ul>\n","type-i-versus-type-ii":"<p>The two types differ by one layer: <strong>Type I</strong> runs directly on the host, <strong>Type II</strong> runs as an application in a host system.</p>\n<ul>\n<li>Type I, also called native or bare-metal, has direct access to hardware and is used in servers and data centres; Xen and KVM are examples.</li>\n<li>Type II, also called hosted, reaches hardware through the host operating system and is used on desktops; VMware Workstation is an example.</li>\n<li>A guest's I/O passes through two operating systems in the Type II case.</li>\n</ul>\n","the-roles-of-a-hypervisor":"<p>Five responsibilities, one per virtualized resource.</p>\n<ul>\n<li><strong>Isolating and emulating resources</strong> is the general responsibility.</li>\n<li><strong>CPU</strong>: scheduling virtual machines.</li>\n<li><strong>Memory</strong>: managing memory.</li>\n<li><strong>I/O</strong>: emulating I/O devices, which an unmodified operating system looks for and will not boot without.</li>\n<li><strong>Networking</strong>, and managing virtual machines.</li>\n</ul>\n","cpu-virtualization":"<p>A VM is a duplicate of a computer system, and most of its instructions execute on the host processor in native mode.</p>\n<ul>\n<li>The rest are <strong>privileged</strong> instructions, which trap when executed outside privileged mode.</li>\n<li><strong>Control-sensitive</strong> instructions change the configuration of resources; <strong>behaviour-sensitive</strong> ones differ by configuration.</li>\n<li>An architecture is virtualizable when those instructions are trapped in the VMM, which mediates hardware access from different VMs.</li>\n<li>RISC virtualizes naturally; x86 needed binary translation, paravirtualization or hardware-assisted extensions.</li>\n</ul>\n","memory-virtualization":"<p>Virtual memory virtualization shares the system's RAM, allocating it dynamically to the VMs.</p>\n<ul>\n<li>Traditionally the mapping from virtual to machine memory is one stage, through page tables.</li>\n<li>Virtualized, it takes two: the guest OS maps virtual addresses to its own physical memory, and the VMM maps those to real machine memory.</li>\n<li>The second stage exists so a guest cannot name memory belonging to another guest or the hypervisor.</li>\n<li>The price is an extra translation on every access, which nested page tables recover.</li>\n</ul>\n","i-o-virtualization":"<p>Three approaches, each trading compatibility against overhead.</p>\n<ul>\n<li><strong>Full device emulation</strong> replicates device enumeration, identification, interrupts and DMA in software in the VMM, so unmodified guests work, at a very high overhead.</li>\n<li><strong>Direct I/O</strong> gives a VM direct access to devices, achieving close-to-native performance, though a reclaimed device may be left in an arbitrary state.</li>\n<li><strong>Hardware-assisted</strong> virtualization puts the remapping and isolation in hardware, since software emulation costs too much.</li>\n<li>The virtual device remaps guest and real I/O addresses and multiplexes the physical device.</li>\n</ul>\n","the-xen-architecture":"<p><strong>Xen</strong> is an open-source hypervisor developed by Cambridge University.</p>\n<ul>\n<li>It is a micro-kernel hypervisor that separates policy from mechanism, leaving policy to <strong>Domain 0</strong>.</li>\n<li>It includes no device drivers natively, only a mechanism by which a guest OS reaches the physical devices.</li>\n<li>The guest OS with control ability is Domain 0; the others are <strong>Domain U</strong>.</li>\n<li>Domain 0 is loaded first at boot and allocates and maps hardware resources for the guest domains.</li>\n</ul>\n","benefits-of-virtualization":"<p>Five benefits, each a cloud property restated at the machine level.</p>\n<ul>\n<li><strong>Sharing of resources</strong>: the multiplexing that makes pay-per-usage economical.</li>\n<li><strong>Isolation</strong>: virtual machines are isolated from each other as if physically separated, which is what makes multi-tenancy possible.</li>\n<li><strong>Encapsulation</strong>: a VM encapsulates a complete computing environment, so a whole machine becomes one file.</li>\n<li><strong>Hardware independence</strong>: VMs run independently of the underlying hardware.</li>\n<li><strong>Portability</strong>: VMs can be migrated between different hosts, which is what live migration is.</li>\n</ul>\n","hypervisor-vulnerabilities-and-nohype":"<p>Because the hypervisor sits between every guest and the hardware, it is a single point of attack that can see every guest.</p>\n<ul>\n<li>The threat is malicious software running on the same server, attacking the hypervisor and reaching other VMs; the term is <strong>VM escape</strong>.</li>\n<li><strong>NoHype</strong> is one research answer: remove the hypervisor, and there is nothing to attack.</li>\n<li>It still retains the needs of a virtualized cloud infrastructure.</li>\n<li>The trade-off: the isolation the hypervisor provides is also the isolation it must be trusted to provide.</li>\n</ul>\n","what-a-virtual-machine-is":"<p>A <strong>virtual machine</strong> is a software program that emulates the functionality of physical hardware or a computing system.</p>\n<ul>\n<li>It runs on top of the <strong>hypervisor</strong>, which replicates the underlying hardware resources in software.</li>\n<li>The physical hardware is the <strong>host machine</strong>, and the VM running on it is the guest machine.</li>\n<li>The VM contains what it needs to run its applications: storage, memory and networking.</li>\n<li>A guest usually runs a complete operating system of its own, which is why a VM image is measured in gigabytes.</li>\n</ul>\n","what-a-container-is":"<p><strong>Containerization</strong> creates abstraction at an OS level, letting several isolated workloads share the same physical resources.</p>\n<ul>\n<li>A container is a unit of software that is lightweight but still bundles the code, its dependencies and the configuration into a single image.</li>\n<li>Containers can run on bare-metal servers, on hypervisors, or in cloud infrastructure.</li>\n<li>The defining difference: a containerization engine creates isolated environments within the same host system kernel, separate only in their binaries and libraries.</li>\n<li>That is what makes them more resource-efficient compared to VMs.</li>\n</ul>\n","the-comparison-and-the-costs-on-each-side":"<p>Both virtualize, at different levels: a VM virtualizes the machine, a container the operating system.</p>\n<ul>\n<li>A VM's abstraction is at hardware level; a container's is at operating-system level, so it sees a user space.</li>\n<li>A VM instance includes a full guest operating system; a container image includes only the code, dependencies and configuration.</li>\n<li>Containers are more resource-efficient and faster to start, but less secure, because the underlying operating system is shared.</li>\n<li>VMs can run different guest operating systems; all containers on a host run atop the same kernel.</li>\n</ul>\n","the-provider-s-four-layers":"<p>The provider is drawn in layers: service, resource abstraction and control, and physical resource, with management beside them.</p>\n<ul>\n<li>Service layer: SaaS, PaaS and IaaS &mdash; the three delivery models as the customer sees them.</li>\n<li>Resource abstraction and control layer: the hypervisors, virtual machines and control software &mdash; where virtualization lives.</li>\n<li>Physical resource layer: hardware and facility &mdash; servers, storage, network, power, cooling and physical security.</li>\n<li>Cloud service management: business support, provisioning and configuration, portability and interoperability.</li>\n<li>Security, privacy and performance run vertically through all three.</li>\n</ul>\n","the-actors-the-nist-reference-model-s-terminology":"<p>The NIST reference model names six actors.</p>\n<ul>\n<li><strong>Consumer</strong>: the principal stakeholder that maintains a business relationship with the provider.</li>\n<li><strong>Provider</strong>: the entity that makes services available.</li>\n<li><strong>Auditor</strong>: conducts an audit to express an opinion, verifying conformance to standards; SLA verification depends on it.</li>\n<li><strong>Broker</strong>: manages the use, performance and delivery of cloud services and negotiates between providers and consumers, through intermediation, aggregation and arbitrage.</li>\n<li><strong>Developer</strong> builds applications on the provider's platform, and <strong>Carrier</strong> provides the connectivity.</li>\n</ul>\n","the-provisioning-problem-and-the-sla-tension":"<p>Providers supply cloud services by signing SLAs with end users, committing enough CPU, memory and bandwidth for a preset period.</p>\n<ul>\n<li><strong>Underprovisioning</strong> leads to broken SLAs and penalties.</li>\n<li><strong>Overprovisioning</strong> leads to resource underutilisation and a decrease in revenue.</li>\n<li>So provisioning is a commercial optimum rather than a technical one.</li>\n<li>Five sources of difficulty: unpredictable consumer demand, software and hardware failures, heterogeneity of services, power management, and conflicts between the signed SLAs.</li>\n</ul>\n","efficient-vm-provisioning":"<p>Efficient VM provisioning depends on the cloud architecture and on managing cloud infrastructures.</p>\n<ul>\n<li>In a virtualised cluster it demands three capabilities: efficient installation of VMs, live VM migration, and fast recovery from failures.</li>\n<li>Users treat VMs as physical hosts with customised operating systems for specific applications.</li>\n<li>Amazon EC2 uses <strong>Xen</strong> as the virtual machine monitor, the same VMM as IBM's Blue Cloud, and provides predefined VM templates.</li>\n<li>IBM's Blue Cloud provides no templates; Microsoft applies virtualization in Azure.</li>\n</ul>\n","the-three-provisioning-methods":"<p>Three provisioning methods: <strong>demand-driven</strong>, <strong>event-driven</strong> and <strong>popularity-driven</strong>.</p>\n<ul>\n<li>Demand-driven adds or removes instances by utilisation: below a threshold decrease capacity, above it increase.</li>\n<li>Easy to implement, but it fails when the workload changes abruptly &mdash; by the time the threshold is crossed, the capacity is needed.</li>\n<li>Event-driven anticipates a specific time event, such as Christmastime, and works well if the event is predicted correctly.</li>\n<li>Popularity-driven creates instances for currently popular applications, with the same risk of wasted resources if traffic does not occur.</li>\n</ul>\n","the-software-stack-and-runtime-support":"<p>Two closing ideas about cloud architecture.</p>\n<ul>\n<li>The <strong>software stack</strong> is built from scratch for rigorous goals, so every layer is designed for high throughput, high availability and fault tolerance.</li>\n<li>The lower layers are not completely transparent to the upper layers, because each layer sells a different thing.</li>\n<li><strong>Runtime support services</strong>: cluster monitoring collects the runtime status of the whole cluster, and a scheduler queues tasks and assigns them to nodes by availability.</li>\n<li>The distributed scheduler has special characteristics, such as scheduling programs written in MapReduce style.</li>\n</ul>\n","cloud-service-tasks-and-trends":"<p>A short list for a question on the current state of the cloud.</p>\n<ul>\n<li><strong>SaaS</strong> is the top layer for business applications; <strong>CRM</strong> offered the first successful SaaS on the cloud.</li>\n<li>SaaS tools also serve distributed collaboration, financial and human-resources management.</li>\n<li><strong>PaaS</strong> is provided by Google, Salesforce.com and Facebook among others; <strong>IaaS</strong> by Amazon, Windows Azure and Rackspace.</li>\n<li><strong>Collocation services</strong> require multiple providers to work together to support supply chains in manufacturing.</li>\n<li><strong>Network cloud services</strong> provide communications, from AT&amp;T, Qwest and AboveNet.</li>\n</ul>\n"},
  pastSummary: `<h2>Exam-facing summary</h2>
<table class="comparison-table">
<thead>
<tr><th>If the question says&hellip;</th><th>Give&hellip;</th></tr>
</thead>
<tbody>
<tr><td>Define virtualization</td><td>The ability to run multiple operating systems on one physical system and share the underlying hardware, so that one computer hosts the appearance of many; used to improve IT throughput and costs by treating physical resources as a pool from which virtual resources are allocated.</td></tr>
<tr><td>Explain the types of virtualization</td><td>Application, network, desktop, storage, server and data &mdash; one line each.</td></tr>
<tr><td>What is a hypervisor?</td><td>A program (VMM) that allows multiple operating systems to share one hardware host: each guest appears to have the processor, memory and resources to itself, while the hypervisor allocates what is needed in turn and prevents guests from disrupting each other. It sits directly between hardware and OS and provides hypercalls; its roles are isolating/emulating resources &mdash; CPU scheduling, memory management, I/O emulation &mdash; networking and managing VMs.</td></tr>
<tr><td>Type I versus Type II (4 marks)</td><td>The table and Fig 6.1: where it runs (directly on the host, no base OS &mdash; versus as an application on a host system), the names (native/bare metal versus hosted), hardware access (direct versus through the host OS), use (data centres versus desktops) and examples (Xen, KVM, ESXi versus VMware Workstation, VirtualBox). Xen on EC2 and Blue Cloud is the concrete case.</td></tr>
<tr><td>Explain CPU / memory / I/O virtualization</td><td>CPU: privileged, control-sensitive and behaviour-sensitive instructions, trap-and-emulate, virtualizable architectures, RISC versus x86. Memory: the one-stage page-table mapping becoming two stages (VA to PA by the guest OS, PA to MA by the VMM), with the MMU and TLB. I/O: full device emulation versus direct I/O versus hardware-assisted, with the overhead and the device-reclamation hazard.</td></tr>
<tr><td>What is the Xen architecture?</td><td>An open-source micro-kernel hypervisor from Cambridge University separating policy from mechanism: it implements the mechanisms and leaves policy to Domain 0; no native device drivers; small; Domain 0 is the privileged guest loaded first, accessing hardware directly and allocating resources for Domain U guests.</td></tr>
<tr><td>Benefits of virtualization</td><td>Sharing of resources for cost reduction, isolation as if physically separated, encapsulation of a complete computing environment, hardware independence, and portability with migration between hosts.</td></tr>
<tr><td>Compare VMs and containers</td><td>Abstraction level (hardware versus OS), what each instance includes (a whole guest OS versus code, dependencies and configuration only), resource efficiency (larger and less portable versus more efficient), isolation (full versus weaker, sharing the host kernel), flexibility (different guest OSes versus same kernel), plus the individual pros and cons lists and Fig 6.3.</td></tr>
<tr><td>Explain the cloud reference architecture</td><td>The four layers (service layer with SaaS/PaaS/IaaS, resource abstraction and control, physical resource with hardware and facility, and cloud service management with business support, provisioning/configuration and portability/interoperability), the cross-cutting security/privacy/performance/audit concerns, and the NIST actors (consumer, provider, auditor, broker with intermediation, aggregation and arbitrage, developer, carrier).</td></tr>
<tr><td>Resource provisioning and its problems</td><td>SLAs commit resources for a preset period; underprovisioning breaks SLAs and incurs penalties while overprovisioning causes underutilisation and lost revenue; the five sources of difficulty; and the three methods &mdash; demand-driven with thresholds and EC2 auto-scaling, event-driven for seasonal events, popularity-driven.</td></tr>
</tbody>
</table>


`,

  slides: `
<h2>The teacher's slides for this unit</h2>
<p class="ref-intro">These are the pictures that came with this unit &mdash; the class deck, the reference notes and the pages handed out with them &mdash; collected here so that the notes above read as writing rather than as a pile of screenshots. Each group is headed by the section of the notes its pictures belong to, in that order, and names the file and the slides they came from. The diagrams the notes themselves need are drawn in the notes.</p>

<h3>The definition, and why it is the foundation of cloud computing</h3>

<p class="ref-meta">From <em>Ch6_Virtlzn_Cloud-Ref-Arch_ResrcProvsnMgmt.pptx</em>, slide 3.</p>

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s03-079.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s03-079.webp" alt="Virtualization Architecture" width="413" height="186" loading="lazy" decoding="async">
<figcaption>Virtualization Architecture</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>The six kinds of virtualization</h3>

<p class="ref-meta">From <em>Ch6_Virtlzn_Cloud-Ref-Arch_ResrcProvsnMgmt.pptx</em>, slides 4&ndash;10.</p>

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s07-083.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s07-083.webp" alt="Illustration for The six kinds of virtualization" width="1175" height="742" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s08-084.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s08-084.webp" alt="Illustration for The six kinds of virtualization" width="1170" height="738" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s09-085.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s09-085.webp" alt="Illustration for The six kinds of virtualization" width="1166" height="706" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s04-080.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s04-080.webp" alt="Illustration for The six kinds of virtualization" width="1184" height="667" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s05-081.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s05-081.webp" alt="Illustration for The six kinds of virtualization" width="1180" height="708" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s06-082.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s06-082.webp" alt="Illustration for The six kinds of virtualization" width="1166" height="648" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s10-086.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s10-086.webp" alt="Illustration for The six kinds of virtualization" width="1156" height="739" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>Type I versus Type II</h3>

<p class="ref-meta">From <em>Ch6_Virtlzn_Cloud-Ref-Arch_ResrcProvsnMgmt.pptx</em>, slide 12.</p>

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s12-087.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s12-087.webp" alt="Illustration for Type I versus Type II — Group B, question 11" width="1159" height="737" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>CPU virtualization</h3>

<p class="ref-meta">From <em>Ch6_Virtlzn_Cloud-Ref-Arch_ResrcProvsnMgmt.pptx</em>, slides 17&ndash;18.</p>

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s17-091.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s17-091.webp" alt="Illustration for CPU virtualization" width="1104" height="790" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s18-092.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s18-092.webp" alt="Illustration for CPU virtualization" width="1101" height="663" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>Memory virtualization</h3>

<p class="ref-meta">From <em>Ch6_Virtlzn_Cloud-Ref-Arch_ResrcProvsnMgmt.pptx</em>, slides 19&ndash;21.</p>

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s19-093.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s19-093.webp" alt="Illustration for Memory virtualization" width="1082" height="610" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s20-094.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s20-094.webp" alt="Illustration for Memory virtualization" width="1087" height="471" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s21-095.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s21-095.webp" alt="Illustration for Memory virtualization" width="1127" height="684" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>I/O virtualization</h3>

<p class="ref-meta">From <em>Ch6_Virtlzn_Cloud-Ref-Arch_ResrcProvsnMgmt.pptx</em>, slides 22&ndash;23.</p>

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s22-096.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s22-096.webp" alt="Illustration for I/O virtualization" width="1120" height="680" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s23-097.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s23-097.webp" alt="Illustration for I/O virtualization" width="1075" height="733" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>The Xen architecture</h3>

<p class="ref-meta">From <em>Ch6_Virtlzn_Cloud-Ref-Arch_ResrcProvsnMgmt.pptx</em>, slides 14&ndash;16.</p>

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s14-088.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s14-088.webp" alt="Illustration for The Xen architecture" width="1161" height="628" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s15-089.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s15-089.webp" alt="Illustration for The Xen architecture" width="1173" height="686" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s16-090.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s16-090.webp" alt="Illustration for The Xen architecture" width="1175" height="412" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>What a virtual machine is</h3>

<p class="ref-meta">From <em>Ch6_Virtlzn_Cloud-Ref-Arch_ResrcProvsnMgmt.pptx</em>, slides 30&ndash;31.</p>

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s30-100.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s30-100.webp" alt="Illustration for What a virtual machine is" width="970" height="483" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s31-101.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s31-101.webp" alt="Illustration for What a virtual machine is" width="1178" height="454" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>What a container is</h3>

<p class="ref-meta">From <em>Ch6_Virtlzn_Cloud-Ref-Arch_ResrcProvsnMgmt.pptx</em>, slides 29 and 33&ndash;34.</p>

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s33-103.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s33-103.webp" alt="Illustration for What a container is" width="966" height="539" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s34-104.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s34-104.webp" alt="Illustration for What a container is" width="1170" height="478" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s34-105.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s34-105.webp" alt="Illustration for What a container is" width="1165" height="399" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s29-099.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s29-099.webp" alt="Illustration for What a container is" width="935" height="420" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>The comparison, and the costs on each side</h3>

<p class="ref-meta">From <em>Ch6_Virtlzn_Cloud-Ref-Arch_ResrcProvsnMgmt.pptx</em>, slides 32 and 35.</p>

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s32-102.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s32-102.webp" alt="Illustration for The comparison, and the costs on each side" width="1155" height="599" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s35-106.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s35-106.webp" alt="Why Containers?" width="972" height="475" loading="lazy" decoding="async">
<figcaption>Why Containers?</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>The provider's four layers</h3>

<p class="ref-meta">From <em>Ch6_Virtlzn_Cloud-Ref-Arch_ResrcProvsnMgmt.pptx</em>, slide 36.</p>

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s36-107.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s36-107.webp" alt="Cloud Reference Architecture" width="1189" height="696" loading="lazy" decoding="async">
<figcaption>Cloud Reference Architecture</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>The actors — the NIST reference model's terminology</h3>

<p class="ref-meta">From <em>Ch6_Virtlzn_Cloud-Ref-Arch_ResrcProvsnMgmt.pptx</em>, slide 37.</p>

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s37-108.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s37-108.webp" alt="Illustration for The actors — the NIST reference model's terminology" width="967" height="683" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>The provisioning problem, and the SLA tension</h3>

<p class="ref-meta">From <em>Ch6_Virtlzn_Cloud-Ref-Arch_ResrcProvsnMgmt.pptx</em>, slide 39.</p>

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s39-109.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s39-109.webp" alt="Resource Provisioning" width="1075" height="478" loading="lazy" decoding="async">
<figcaption>Resource Provisioning</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>Efficient VM provisioning</h3>

<p class="ref-meta">From <em>Ch6_Virtlzn_Cloud-Ref-Arch_ResrcProvsnMgmt.pptx</em>, slide 40.</p>

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s40-110.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s40-110.webp" alt="Illustration for Efficient VM provisioning" width="1079" height="481" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>The three provisioning methods</h3>

<p class="ref-meta">From <em>Ch6_Virtlzn_Cloud-Ref-Arch_ResrcProvsnMgmt.pptx</em>, slides 41&ndash;44.</p>

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s42-112.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s42-112.webp" alt="Illustration for The three provisioning methods" width="1073" height="526" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s43-113.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s43-113.webp" alt="Illustration for The three provisioning methods" width="1077" height="529" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s44-114.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s44-114.webp" alt="Illustration for The three provisioning methods" width="1081" height="412" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s41-111.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s41-111.webp" alt="Illustration for The three provisioning methods" width="460" height="360" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>The software stack and runtime support</h3>

<p class="ref-meta">From <em>Ch6_Virtlzn_Cloud-Ref-Arch_ResrcProvsnMgmt.pptx</em>, slides 46&ndash;47.</p>

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s46-116.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s46-116.webp" alt="Illustration for The software stack and runtime support" width="1072" height="520" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s47-117.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s47-117.webp" alt="Illustration for The software stack and runtime support" width="1078" height="517" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>Cloud service tasks and trends</h3>

<p class="ref-meta">From <em>Ch6_Virtlzn_Cloud-Ref-Arch_ResrcProvsnMgmt.pptx</em>, slide 45.</p>

<!-- dcc-fig:ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s45-115.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch6/ch6-virtlzn-cloud-ref-arch-resrcprovsnmgmt-s45-115.webp" alt="Inter-Cloud Resource Management" width="1073" height="537" loading="lazy" decoding="async">
<figcaption>Inter-Cloud Resource Management</figcaption>
</figure>
<!-- /dcc-fig -->
`,
  quiz: [
    {
      q: 'What is virtualization?',
      options: [
        'Installing an application on many machines at once',
        'The ability to run multiple operating systems on a single physical system and share the underlying hardware resources',
        'Converting physical servers into containers',
        'Moving data to a remote data centre'
      ],
      answer: 1,
      explanation: 'It is the process by which one computer hosts the appearance of many computers, used to improve IT throughput and costs by using physical resources as a pool from which virtual resources can be allocated.'
    },
    {
      q: 'A Type I hypervisor is also known as:',
      options: [
        'A hosted hypervisor',
        'A native or bare-metal hypervisor',
        'A guest hypervisor',
        'A container engine'
      ],
      answer: 1,
      explanation: 'Type I runs directly on the underlying host system and requires no base server operating system, which is why it is called native or bare metal; it has direct access to hardware resources. Type II is the hosted hypervisor, which runs as an application in a host system.'
    },
    {
      q: 'Which of these is a Type II hypervisor?',
      options: [
        'Xen',
        'VMware ESXi',
        'Oracle VirtualBox',
        'KVM'
      ],
      answer: 2,
      explanation: 'VirtualBox (and VMware Workstation) run as applications on a host operating system. Xen, KVM and VMware ESXi run directly on the hardware — and Xen is the VMM used by Amazon EC2 and IBM Blue Cloud.'
    },
    {
      q: 'Which is a role of the hypervisor?',
      options: [
        'Compiling applications for the guest OS',
        'Scheduling virtual machines on the CPU, managing memory, emulating I/O devices and networking',
        'Providing the cloud billing system',
        'Encrypting the guest operating systems'
      ],
      answer: 1,
      explanation: 'The roles: isolating/emulating resources, with CPU for scheduling virtual machines, memory for memory management, I/O for emulating I/O devices, networking, and managing virtual machines.'
    },
    {
      q: 'What happens to a privileged instruction executed by a virtual machine under a VMM?',
      options: [
        'It is executed natively with no overhead',
        'It is trapped in the VMM, which acts as a unified mediator for hardware access from different VMs',
        'It is silently discarded',
        'It crashes the VM'
      ],
      answer: 1,
      explanation: 'Privileged instructions execute in a privileged mode and are trapped if executed outside it. The VMM then mediates hardware access, which is what guarantees correctness and stability for the whole system. Unprivileged instructions of the VM run directly on the host in native mode for efficiency.'
    },
    {
      q: 'Why were x86 architectures harder to virtualize than RISC architectures?',
      options: [
        'Because x86 has no memory management unit',
        'Because on RISC all control- and behaviour-sensitive instructions are privileged, while x86 was not primarily designed to support virtualization',
        'Because x86 cannot run multiple processes',
        'Because RISC has no privileged instructions at all'
      ],
      answer: 1,
      explanation: 'A CPU architecture is virtualizable if it can run the VM\'s privileged and unprivileged instructions in user mode while the VMM runs in supervisor mode. On RISC, all control- and behaviour-sensitive instructions are privileged and therefore trap; x86 had sensitive but unprivileged instructions, which needed binary translation, paravirtualization or hardware-assisted virtualization to handle.'
    },
    {
      q: 'In memory virtualization, who maps what?',
      options: [
        'The guest OS maps machine memory to virtual memory',
        'The guest OS maps virtual addresses to guest physical addresses, and the VMM maps guest physical to machine memory',
        'The hypervisor alone maps virtual addresses straight to machine memory',
        'The CPU maps everything with no software involvement'
      ],
      answer: 1,
      explanation: 'A two-stage mapping replaces the one-stage page-table mapping of a traditional OS: the guest OS continues to control virtual-to-physical mapping for its own VM, and the VMM is responsible for mapping guest physical memory to actual machine memory. The MMU and TLB optimize the translation.'
    },
    {
      q: 'Which approach to I/O virtualization achieves close-to-native performance but has challenges with commodity devices?',
      options: [
        'Full device emulation',
        'Direct I/O virtualization',
        'Copy-on-write disks',
        'Storage virtualization'
      ],
      answer: 1,
      explanation: 'Direct I/O lets the VM access devices directly, avoiding the high CPU cost of emulation, but current implementations focus on networking for mainframes and there are challenges for commodity hardware — for example a reclaimed device may be left in an arbitrary state such as DMA to an arbitrary memory location, which can crash the system.'
    },
    {
      q: 'In Xen, which domain is privileged and allocates hardware resources for the guests?',
      options: [
        'Domain U',
        'Domain 0',
        'The virtual device domain',
        'The driver domain of each guest'
      ],
      answer: 1,
      explanation: 'Domain 0 is the privileged guest OS of Xen, loaded first when Xen boots without file-system drivers available; it is designed to access hardware directly and manage devices, allocating and mapping hardware resources for the Domain U guest domains.'
    },
    {
      q: 'Which is NOT a benefit of virtualization?',
      options: [
        'Isolation of virtual machines as if they were physically separated',
        'Encapsulation of a complete computing environment',
        'Hardware independence and migration between hosts',
        'Removal of the need for an operating system in each virtual machine'
      ],
      answer: 3,
      explanation: 'The five benefits are sharing of resources for cost reduction, isolation, encapsulation, hardware independence and portability. Virtualization does not remove the need for an OS — a VM is an isolated runtime environment (guest OS and applications); it is containers that share one host kernel.'
    },
    {
      q: 'What is the key architectural difference between a container and a virtual machine?',
      options: [
        'Containers cannot run in the cloud',
        'Containers create isolated OS environments within the same host system kernel, so only binaries, libraries and runtime components are separate per container',
        'Containers emulate the hardware directly like a hypervisor',
        'Containers always include a full guest operating system'
      ],
      answer: 1,
      explanation: 'Containerization abstracts at the OS level and shares the host kernel through a container engine such as Docker, which makes containers more resource-efficient than VMs. The consequence is that all containers must run atop the same kernel, that they are less secure due to sharing the underlying OS (Meltdown), and that there is less flexibility about hardware.'
    },
    {
      q: 'Which is a stated disadvantage of containers?',
      options: [
        'They cannot be versioned',
        'All containers must run atop the same kernel, are less secure due to sharing the underlying OS, and are less flexible with respect to hardware',
        'They require a hypervisor',
        'They cannot run on bare-metal servers'
      ],
      answer: 1,
      explanation: 'The three cons are those. Their pros are compartmentalisation, portability (size, ease of defining a container, versioning), a great ecosystem, and using the host kernel for resource allocation. Containers can run on bare metal, on hypervisors, or in cloud infrastructure.'
    },
    {
      q: 'In the cloud reference architecture, which layer contains the hypervisors and turns physical resources into the pool the services are sold from?',
      options: [
        'Service layer',
        'Resource abstraction and control layer',
        'Physical resource layer',
        'Cloud service management'
      ],
      answer: 1,
      explanation: 'The provider stacks the service layer (SaaS, PaaS, IaaS) above the resource abstraction and control layer above the physical resource layer (hardware and facility), with cloud service management (business support, provisioning and configuration, portability and interoperability) alongside them.'
    },
    {
      q: 'Which NIST cloud actor conducts audits with the intent to express an opinion, verifying conformance to standards through objective evidence?',
      options: [
        'The broker',
        'The consumer',
        'The auditor',
        'The carrier'
      ],
      answer: 2,
      explanation: 'The auditor performs audits to verify conformance to standards through review of objective evidence. The broker manages use, performance and delivery of services and negotiates between providers and consumers, through intermediation, aggregation or arbitrage; the consumer is the principal stakeholder maintaining a business relationship with the provider.'
    },
    {
      q: 'Why is overprovisioning a problem for a cloud provider?',
      options: [
        'It breaks the SLA and incurs penalties',
        'It leads to resource underutilisation and consequently a decrease in revenue',
        'It increases heat dissipation beyond the facility limit only',
        'It is impossible with an autonomous system'
      ],
      answer: 1,
      explanation: 'The two-sided error: underprovisioning breaks SLAs and leads to penalties, while overprovisioning wastes resources and lowers revenue. That is why efficient provisioning is a commercial optimisation, made harder by unpredictable demand, failures, service heterogeneity, power management and conflicting SLAs.'
    },
    {
      q: 'Which provisioning method adds or removes instances based on the current utilisation of allocated resources?',
      options: [
        'Event-driven',
        'Popularity-driven',
        'Demand-driven',
        'Migration-driven'
      ],
      answer: 2,
      explanation: 'The demand-driven method uses thresholds — for example a CPU utilisation range of 30% to 70%, decreasing capacity below 30% and increasing it above 70% — and Amazon implements such an auto-scale feature in EC2. It is easy to implement but fails when the workload changes abruptly. The event-driven and popularity-driven methods are predictive.'
    },
    {
      q: 'For which situation is the event-driven provisioning method best suited?',
      options: [
        'A workload that changes abruptly with no pattern',
        'Seasonal or predicted events such as Christmastime or the Lunar New Year',
        'A steady state that never varies',
        'Applications that suddenly become popular on social media'
      ],
      answer: 1,
      explanation: 'Event-driven provisioning adds or removes instances based on a specific time event and anticipates peak traffic before it happens, working best for seasonal or predicted events; if the prediction is wrong, wasted resources are even greater. Sudden social-media popularity is the popularity-driven method\'s case.'
    }
  ],

  past: [
    {
      year: '2025 (expected)',
      marks: '8',
      repeats: 1,
      q: 'Explain the Cloud Reference Architecture with a suitable diagram.',
      occ: [
        { year: '2025 (expected)', marks: '8', q: 'Explain the Cloud Reference Architecture with a suitable diagram.' }
      ],
      answer: `
<h4>Model answer &mdash; 8 marks</h4>
<p>The reference architecture is a stack, and it is marked as a stack: describe it from the
bottom up and draw the layers beside the description.</p>
<ul>
<li><strong>Physical / infrastructure layer</strong> &mdash; servers, storage, network. The
provider's data-centre hardware; the customer never sees it. Everything above is virtualised
out of this.</li>
<li><strong>Virtualisation layer</strong> &mdash; the hypervisor and virtual network. It turns
the physical resources into a pool that can be partitioned into virtual machines on demand,
which is what makes <em>pooling</em> and <em>elasticity</em> possible.</li>
<li><strong>Resource provisioning and management layer</strong> &mdash; the scheduler and the
control plane. It decides which host a workload lands on, allocates and reclaims resources,
monitors usage and enforces the policies that metering and SLAs depend on.</li>
<li><strong>Service layer</strong> &mdash; the three service models as a stack: IaaS exposes the
VMs, PaaS adds the runtime and middleware, SaaS is the finished application.</li>
<li><strong>Access / user layer</strong> &mdash; the interfaces: web console, CLI, APIs. This is
where <em>on-demand self-service</em> is actually delivered.</li>
<li><strong>Cross-cutting: security, management and governance</strong> &mdash; not a layer but
a column through all of them: identity and access management, encryption, monitoring, billing,
compliance.</li>
</ul>
<p>Draw it as six horizontal bands with one vertical band down the side, and label the vertical
band as the cross-cutting concerns. The unit's diagram follows the NIST reference architecture
presented this way.</p>
<div class="concept-box tip">
<h4>Marking this one</h4>
<p>Predicted &mdash; the previous site lists it under “2025 Exam / Expected”, 8 marks,
and it says “with a suitable diagram”. That phrase is an instruction: an unlabelled
diagram earns little and a labelled stack with the cross-cutting column earns most of it. Name
the layer, then say what it does in one clause &mdash; that is a mark per layer.</p>
</div>
`
    },
    {
      year: '2025 (expected)',
      marks: '5',
      repeats: 1,
      q: 'Compare Virtual Machines and Containers.',
      occ: [
        { year: '2025 (expected)', marks: '5', q: 'Compare Virtual Machines and Containers.' }
      ],
      answer: `
<h4>Model answer &mdash; 5 marks</h4>
<p>The difference is <strong>where the boundary is drawn</strong>. A virtual machine virtualises
the <em>hardware</em>; a container virtualises the <em>operating system</em>.</p>
<table class="comparison-table">
<tr><th>Aspect</th><th>Virtual machine</th><th>Container</th></tr>
<tr><td>What is virtualised</td><td>The hardware, by a hypervisor</td><td>The host OS kernel, by a container engine</td></tr>
<tr><td>Guest OS</td><td>Each VM has its own full OS</td><td>None &mdash; containers share the host kernel</td></tr>
<tr><td>Size and boot</td><td>Gigabytes, tens of seconds</td><td>Megabytes, under a second</td></tr>
<tr><td>Isolation</td><td>Strong: a hardware boundary</td><td>Weaker: namespaces and cgroups, shared kernel</td></tr>
<tr><td>Density</td><td>Few per host</td><td>Many per host</td></tr>
<tr><td>Portability</td><td>Portable between hypervisors</td><td>Portable between hosts running a compatible kernel</td></tr>
</table>
<p>The one-sentence answer: a VM pays for strong isolation with a whole operating system per
workload, and a container drops that cost by sharing the kernel, which is why containers are
where microservices are usually deployed and VMs are where different operating systems and
untrusted tenants usually are.</p>
<div class="concept-box tip">
<h4>Marking this one</h4>
<p>Predicted &mdash; from the previous site's “2025 Exam / Expected” set, 5 marks. Say
what is virtualised first; every other difference follows from it, and an answer that lists
five differences without naming that one has the detail but not the structure.</p>
</div>
`
    },
    {
      year: 'Model 2025',
      marks: '2',
      repeats: 1,
      q: 'What is virtualization in cloud computing?',
      occ: [
        { year: 'Model 2025', marks: '2', q: 'What is virtualization in cloud computing?' }
      ],
      answer: `
<h4>Model answer &mdash; 2 marks</h4>
<p><strong>Virtualization is the ability to run multiple operating systems on a single physical system and share the underlying hardware resources.</strong> It is <strong>the process by which one computer hosts the appearance of many computers</strong>, and it is <strong>used to improve IT throughput and costs by using physical resources as a pool from which virtual resources can be allocated</strong>.</p>
<p>In cloud computing it is the foundation of the delivery models: a <strong>virtual machine (VM) is an isolated runtime environment &mdash; a guest OS and its applications &mdash; and multiple virtual systems can run on a single physical system</strong>, above a <strong>virtualization platform</strong> such as Xen, KVM or VMware. That is what makes <strong>elasticity</strong> (creating and destroying machines on demand), <strong>pay-per-usage</strong> (metering per virtual machine) and <strong>resource multiplexing</strong> (several guests sharing one box) possible &mdash; the defining characteristics of the cloud.</p>
<p><em>To extend to a longer answer:</em> add the six types &mdash; <strong>application, network, desktop, storage, server and data</strong> virtualization &mdash; and the five benefits: <strong>sharing of resources for cost reduction, isolation, encapsulation, hardware independence and portability</strong>.</p>

<div class="concept-box tip">
<h4>Where this came from</h4>
<p>Group A, question 4 of the <em>Model Question 2025</em> &mdash; 2 marks, so the definition plus one sentence on why the cloud needs it is a complete answer. Group A rewards the formal definition, so give it in the syllabus's own words before explaining.</p>
</div>`
    },
    {
      year: 'Model 2025',
      marks: '4',
      repeats: 2,
      q: 'Explain the difference between a hypervisor Type I and Type II.',
      occ: [
        { year: 'Model 2025', marks: '4', q: 'Explain the difference between a hypervisor Type I and Type II.' },
        { year: '2025 (expected)', marks: '6', q: 'Define Virtualization. Explain the role and types of Hypervisor.' }
      ],
      answer: `
<h4>Model answer &mdash; 4 marks</h4>
<p><strong>What a hypervisor is.</strong> A <strong>hypervisor</strong>, also called a virtual machine manager/monitor (VMM) or virtualization manager, is <strong>a program that allows multiple operating systems to share a single hardware host</strong>. Each guest operating system <strong>appears to have the host's processor, memory and other resources all to itself</strong>, while the hypervisor actually controls the host processor and resources, <strong>allocating what is needed to each operating system in turn and ensuring the guest operating systems cannot disrupt each other</strong>. It <strong>supports hardware-level virtualization on bare-metal devices such as CPU, memory, disk and network interfaces</strong>, <strong>sits directly between the physical hardware and its OS</strong>, and <strong>provides hypercalls to the guest OSes and applications</strong>. The two types differ in <strong>where that layer sits</strong>.</p>

<p><strong>Type I &mdash; native or bare-metal hypervisor.</strong></p>
<ul>
<li><strong>Runs directly on the underlying host system.</strong></li>
<li><strong>Does not require any base server operating system.</strong></li>
<li><strong>Has direct access to hardware resources</strong> &mdash; CPU, memory, disk and network interfaces.</li>
<li>Because there is no host OS in the path, performance is better and there is one fewer layer to compromise.</li>
<li><strong>Examples: Xen, KVM, VMware ESXi.</strong> <strong>Amazon EC2 uses Xen as its virtual machine monitor, and the same VMM is used in IBM's Blue Cloud.</strong></li>
</ul>

<p><strong>Type II &mdash; hosted hypervisor.</strong></p>
<ul>
<li><strong>Does not run directly over the underlying hardware; it runs as an application in a host system (physical machine).</strong></li>
<li>It therefore carries <strong>the host operating system layer above the hardware</strong>, and relies on that host OS for hardware access and device drivers.</li>
<li>It is the appropriate choice on desktops and for development, where the machine already has an OS and the user wants a second one.</li>
<li><strong>Examples: VMware Workstation, Oracle VirtualBox.</strong></li>
</ul>

<p><strong>The comparison in one line.</strong> A Type I hypervisor <strong>replaces</strong> the host operating system and runs on bare metal; a Type II hypervisor <strong>runs on top of</strong> the host operating system as an application. Data centres and cloud providers use Type I (Xen in EC2 and Blue Cloud, which is why EC2 can treat VMs as physical hosts and migrate them live); desktop users use Type II for convenience.</p>

<div class="concept-box tip">
<h4>Where this came from</h4>
<p>Group B, question 11 of the <em>Model Question 2025</em>, worth 4 marks. The question says <em>explain the difference</em>, so a two-column comparison is the fastest full-mark shape: where it runs, the alternative names, hardware access, typical use, examples. Open with the definition of a hypervisor &mdash; it is one sentence and it frames both types as answers to the same question (where does the virtualization layer sit?). Fig 6.1 shows the same thing as a diagram.</p>
</div>`
    }
  ]
};
