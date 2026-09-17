/* Chapter 8 — Security and Challenges in Cloud.

   Syllabus unit 8: 6 hours, 8 marks. Sub-topics 8.1 Data security, privacy and
   compliance, 8.2 Identity and access management (IAM), 8.3 Service Level
   Agreements (SLA), 8.4 Cloud vulnerabilities and risk mitigation.

   Written from the course's own material, read into `_source/dcc/` by
   tools/dcc_extract.py:

     lecture_notes_all_chapterwise_lecturenote_ch_8.txt
         Er. Avijit Karn's 24-slide Chapter 8 deck — data security aspects,
         data lineage and provenance, data remanence, IAM, data privacy and its
         key concerns, the data life cycle and the two SLA topics (criteria and
         life cycle, and SLA management in the cloud)

     lecture_notes_all_chapterwise_cloud_vulnerabilities_and_risk_mitigation.txt
         the two-page vulnerabilities and risk-mitigation reference, which is
         the only source in the folder that is a table rather than a slide
         deck — its eight vulnerabilities and eight control areas are
         reproduced as tables here

   Three additions come from outside those two files, and the prose is written so
   that a reader is not told where each one was read:

     * the AuthN/AuthZ pair in authentication and authorisation, named (Tanenbaum and Van Steen's access-control
       section: a user logs in with a role, and the role determines the
       protection domain), and the least-privilege sentence that follows it
     * the three-term vocabulary added to what an SLA is — service level indicator, objective and
       agreement. The deck says an SLA contains "a number of performance metrics
       and the corresponding service objectives" and the section on SLA management in the cloud uses the word SLOs without defining it, so the acronyms are the chapter's names for the deck's
       own metric and objective; the acronyms themselves are in none of the
       uploaded material and are recorded as a gap in plan.md
     * the per-service-model responsibility table added under the shared responsibility model, which is this
       chapter's own reading of the three service-model definitions — one row per
       model rather than per layer, asserting nothing the definitions do not. Its
       layer-by-layer twin is the boundary table in unit 5

   Model Question 2025, Group B question 12 ("Briefly describe two challenges in    ensuring security in cloud environments", 4 marks) is answered under The two
    challenges worked through. */

window.CHAPTERS = window.CHAPTERS || {};
window.CHAPTERS[8] = {
  learn: `

<h2>Unit 8 &mdash; Security and Challenges in Cloud</h2>
<p class="unit-meta">Syllabus: 6 hours &middot; 8 marks &middot; sub-topics 8.1&ndash;8.4</p>

<p>The unit's four sub-topics answer four different questions about the same thing, and keeping them apart is most of the work. 8.1 Data security, privacy and compliance asks <em>what must be protected, and under what obligation</em> &mdash; the three states of data, provenance, remanence, privacy and the data life cycle. 8.2 Identity and Access Management asks <em>who may do it</em>, which in the cloud means identity rather than a location inside the network. <strong>8.3 Service Level Agreements</strong> asks <em>what was promised</em>, in measurable criteria, and what happens when the promise is missed. 8.4 Cloud vulnerabilities and risk mitigation asks <em>what actually goes wrong</em>, and who is responsible for each part of preventing it. The shared responsibility model is where all four meet.</p>

<p>What makes cloud security specific: the hypervisor is an attack surface, storage virtualisation is multi-tenancy, and the provider's promise is an SLA.</p>

<h2>8.1 Data security, privacy, and compliance</h2>

<h3>The three states of data, and how each is protected</h3>
<p>Data security has four aspects, and the first three are the states data can be in &mdash; <em>data-in-transit</em>, <em>data-at-rest</em> and <em>data-in-use</em>:</p>

<table class="comparison-table">
<thead>
<tr><th>Aspect</th><th>The mechanism</th><th>What it means in practice</th></tr>
</thead>
<tbody>
<tr><td><strong>Data-in-transit</strong></td><td>Two options:<span class="muted"> confidentiality + integrity using a secured protocol, or confidentiality with a non-secured protocol and encryption.</span></td><td>Either the transport protects itself (TLS) or the payload does.<span class="muted"> Integrity matters as much as secrecy, because an attacker who can alter data in transit breaks it.</span></td></tr>
<tr><td><strong>Data-at-rest</strong></td><td>Generally not encrypted,<span class="muted"> since data is commingled with other users' data. The questions that follow: encryption if it is not associated with applications? Indexing and searching? Homomorphic encryption versus predicate encryption?</span></td><td>The tension is that encryption defeats the provider's ability to index or search the data.<span class="muted"> That is why the frontier techniques named are <em>homomorphic</em> encryption (computing on ciphertext) and <em>predicate</em> encryption (revealing only records matching a condition) &mdash; both are attempts to have confidentiality and searchability at once.</span></td></tr>
<tr><td><strong>Data-in-use</strong> (processing, including multitenancy)</td><td>For any application to process data, it is not encrypted.</td><td>The hardest case:<span class="muted"> data must be decrypted to be computed on, so trust in the platform &mdash; and in its operators &mdash; cannot be avoided by cryptography alone. This is where hypervisor isolation becomes a security control rather than a performance feature.</span></td></tr>
<tr><td>Data lineage (knowing when and where data was)</td><td>Knowing when and where the data was located within the cloud<span class="muted"> is important for audit and compliance purposes. Amazon AWS is the example: store &lt;d1, t1, ex1.s3.amazonaws.com&gt;, process &lt;d2, t2, ec2.compute2.amazonaws.com&gt;, restore &lt;d3, t3, ex2.s3.amazonaws.com&gt;.</span></td><td><strong>Each operation is recorded</strong><span class="muted"> as a data identifier, a timestamp and the endpoint that performed it. That record is what makes it possible to answer "where was this record at 14:00 last Tuesday", which is what an auditor asks.</span></td></tr>
</tbody>
</table>

<h3>Data provenance &mdash; the question security cannot answer</h3>
<p><strong>Data provenance</strong> extends lineage into computational accuracy as well as data integrity. The example shows how far the problem reaches:</p>
<p>A financial calculation &mdash; sum((((2&times;3)&times;4)/6) &minus; 2) = $2.00 &mdash; is correct <em>assuming US dollars</em>. Then the questions begin: how about dollars of different countries? The correct exchange rate? Where is (or was) that system located? What was the state of that physical system? How would a customer or auditor verify that information?</p>
<div class="concept-box key">
<h4>Why this is a cloud problem specifically</h4>
<p>Because the workload ran on a machine the customer does not own, in a jurisdiction they may not know, at a time they cannot independently verify. Integrity of data is not integrity of computation &mdash; the bytes can be untouched while the result is wrong because the environment, the exchange rate table or the machine's state changed. That is why provenance, and the auditability in 8.3, belong in the same unit as encryption.</p>
</div>

<h3>Data remanence and the provider's own data</h3>
<p><strong>Data remanence</strong> is the risk of inadvertent disclosure of sensitive information &mdash; data that remains where it was not intended to remain. It connects directly to storage virtualization, where servers are "not aware of exactly where their data is stored": if you do not know which physical disks hold your blocks, proving that a deleted copy is really gone is correspondingly harder.</p>
<p>The risk of centralisation: to the extent that quantities of data from many companies are centralised, this collection can become an attractive target for criminals. Moreover, the physical security of the data centre and the trustworthiness of system administrators take on new importance. Two consequences follow: aggregation raises the value of a breach (one incident affects many tenants at once), and physical security and administrator trust become part of the customer's risk even though neither is under the customer's control.</p>

<h3>Data privacy</h3>
<div class="concept-box key">
<h4>The definition, and the sentence that limits it</h4>
<p>The concept of privacy varies widely among (and sometimes within) countries, cultures and jurisdictions. It is shaped by public expectations and legal interpretations, so a concise definition is elusive if not impossible. Privacy rights or obligations are related to the collection, use, disclosure, storage and destruction of personal data (or Personally Identifiable Information &mdash; PII). The conclusion: at the end of the day, privacy is about the accountability of organisations to data subjects, as well as the transparency of an organisation's practices around personal information.</p>
</div>

<p>These concerns typically mix security and privacy, and five of them follow. Each comes with the questions it raises:</p>

<table class="comparison-table">
<thead>
<tr><th>Concern</th><th>The questions it raises</th></tr>
</thead>
<tbody>
<tr><td><strong>Storage</strong></td><td>The aggregation of data raises new privacy issues.<span class="muted"> Some governments may decide to search through data without notifying the data owner, depending on where the data resides &mdash; which is data residency as a privacy problem. And: whether the cloud provider itself has any right to see and access customer data? Some services track user behaviour for purposes from targeted advertising to improving services.</span></td></tr>
<tr><td><strong>Retention</strong></td><td>How long is personal information transferred to the cloud retained?<span class="muted"> Which retention policy governs the data? Does the organisation own the data, or the CSP? Who enforces the retention policy in the cloud, and how are exceptions such as litigation holds managed?</span></td></tr>
<tr><td><strong>Destruction</strong></td><td>How does the provider destroy PII at the end of the retention period?<span class="muted"> How do organisations ensure their PII is destroyed by the CSP at the right point and is not available to other cloud users? The structural difficulty: cloud storage providers usually replicate the data across multiple systems and sites &mdash; increased availability is one of the benefits they provide. How do you know the CSP did not retain additional copies? Did the CSP really destroy the data, or just make it inaccessible to the organisation? Is the CSP keeping the information longer than necessary so it can mine the data for its own use?</span></td></tr>
<tr><td>Auditing, monitoring and risk management</td><td>How can organisations monitor their CSP<span class="muted"> and provide assurance to stakeholders that privacy requirements are met when their PII is in the cloud? Are they regularly audited? What happens in the event of an incident? And the organisational consequence: if business-critical processes are migrated to cloud, internal security processes need to evolve to allow multiple cloud providers to participate in them &mdash; including security monitoring, auditing, forensics, incident response and business continuity.</span></td></tr>
<tr><td><strong>Privacy breaches</strong></td><td>How do you know a breach has occurred?<span class="muted"> How do you ensure the CSP notifies you when one occurs? Who is responsible for managing the breach notification process (and its costs)? Do contracts include liability for breaches resulting from negligence of the CSP? How is the contract enforced? How is it determined who is at fault?</span></td></tr>
</tbody>
</table>

<div class="concept-box tip">
<h4>Why deletion is harder in the cloud</h4>
<p><strong>Destruction</strong> answers why data deletion is harder in the cloud. Replication &mdash; the feature that makes cloud storage reliable &mdash; is what makes proven destruction hard, because a copy may exist in a system or site you did not think about. This is data remanence with a mechanism attached, and it is why contracts have to say what "deleted" means.</p>
</div>

<h3>Compliance and the data life cycle</h3>
<p>Compliance is managed over a <strong>data life cycle</strong>, and two rules govern it: personal information should be managed as part of the data used by the organisation and that protection of personal information should consider the impact of the cloud on each phase. The seven phases form a cycle:</p>
<figure class="figure-wide figure-wrap">
<svg class="figure wide" viewBox="0 0 800 260" role="img" aria-label="The data life cycle in seven phases: generation, transformation, transfer, use, storage, archival and destruction">
<defs><marker id="f8a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="flow-arrow-head"/></marker></defs>

<rect class="flow-box phase1" x="20" y="60" width="96" height="48" rx="8"/>
<text class="flow-label" x="68" y="88" text-anchor="middle">1 Generation</text>
<rect class="flow-box phase1" x="132" y="60" width="104" height="48" rx="8"/>
<text class="flow-label" x="184" y="88" text-anchor="middle">2 Transformation</text>
<rect class="flow-box phase2" x="252" y="60" width="90" height="48" rx="8"/>
<text class="flow-label" x="297" y="88" text-anchor="middle">3 Transfer</text>
<rect class="flow-box phase2" x="358" y="60" width="76" height="48" rx="8"/>
<text class="flow-label" x="396" y="88" text-anchor="middle">4 Use</text>
<rect class="flow-box phase3" x="450" y="60" width="90" height="48" rx="8"/>
<text class="flow-label" x="495" y="88" text-anchor="middle">5 Storage</text>
<rect class="flow-box phase3" x="556" y="60" width="92" height="48" rx="8"/>
<text class="flow-label" x="602" y="88" text-anchor="middle">6 Archival</text>
<rect class="flow-box phase4" x="664" y="60" width="110" height="48" rx="8"/>
<text class="flow-label" x="719" y="88" text-anchor="middle">7 Destruction</text>

<path class="flow-arrow" d="M117,84 H129" marker-end="url(#f8a)"/>
<path class="flow-arrow" d="M237,84 H249" marker-end="url(#f8a)"/>
<path class="flow-arrow" d="M343,84 H355" marker-end="url(#f8a)"/>
<path class="flow-arrow" d="M435,84 H447" marker-end="url(#f8a)"/>
<path class="flow-arrow" d="M541,84 H553" marker-end="url(#f8a)"/>
<path class="flow-arrow" d="M649,84 H661" marker-end="url(#f8a)"/>

<text class="flow-label" x="400" y="42" text-anchor="middle">The cloud changes the risk at each phase, so protection is designed per phase:</text>
<text class="flow-label" x="400" y="146" text-anchor="middle">Transfer is where data-in-transit protection applies; storage and archival are where data-at-rest and retention policy apply;</text>
<text class="flow-label" x="400" y="170" text-anchor="middle">use is where the multitenancy question bites, because processing requires the data to be readable;</text>
<text class="flow-label" x="400" y="194" text-anchor="middle">and destruction is where replication makes proof of deletion hard.</text>
</svg>
<figcaption>Fig 8.1 &mdash; The data life cycle used for data compliance. The seven phases are generation, transformation, transfer, use, storage, archival and destruction. Drawn as a cycle, the obligations continue until destruction &mdash; not until the data stops being used.</figcaption>
</figure>

<table class="comparison-table">
<thead>
<tr><th>Phase</th><th>What happens</th><th>What the cloud changes</th></tr>
</thead>
<tbody>
<tr><td>1. Generation</td><td>The data is created or collected<span class="muted"> &mdash; a form submitted, a sensor reading, a click logged.</span></td><td>Collection becomes cheap enough to be indiscriminate,<span class="muted"> and the data is often produced in one jurisdiction while the organisation is in another. What may be collected has to be decided <em>before</em> collection.</span></td></tr>
<tr><td>2. Transformation</td><td>It is converted, combined, aggregated, indexed or anonymised<span class="muted"> into something usable.</span></td><td>Each transformation makes more copies in more places,<span class="muted"> and a de-identification step done wrongly is a breach rather than a report. This is where IAM decides who may run it.</span></td></tr>
<tr><td>3. Transfer</td><td><strong>It moves</strong><span class="muted"> &mdash; between services, between a customer and the provider, between regions.</span></td><td>The classic compliance problem:<span class="muted"> a copy in another region is a copy under another legal regime. Encryption in transit is the technical half of the protection.</span></td></tr>
<tr><td>4. Use</td><td>People and applications read, query and act on it.</td><td>Access arrives over the network rather than from a desk,<span class="muted"> so access control moves from the building to identity (8.2) and every read becomes a loggable event.</span></td></tr>
<tr><td>5. Storage</td><td>It rests in a database, an object store or a volume.</td><td>At-rest encryption, and two problems already named:<span class="muted"> provenance and remanence &mdash; plus the provider's own backups, which you do not see.</span></td></tr>
<tr><td>6. Archival</td><td>It is retained, rarely read, for obligation or history<span class="muted"> &mdash; the Glacier and archive tiers.</span></td><td>Retention law and the right to erasure pull in opposite directions,<span class="muted"> so archival data must stay <em>findable</em>. What cannot be located cannot be destroyed.</span></td></tr>
<tr><td>7. Destruction</td><td>It is disposed of at the end of its life.</td><td>Deletion is a request to a provider, not an act you perform.<span class="muted"> Certified deletion is the answer, and remanence is the reason it has to be certified.</span></td></tr>
</tbody>
</table>

<p>Compliance is a property of the whole life cycle, not of the moment data is stored &mdash; which is why personal information must be managed <em>as part of the data used by the organisation</em> rather than as a separate category to be locked away. And cloud storage multiplies the copies while shortening the list of places to point at: the same object may exist in three regions, in a backup the customer cannot see and in a cache nobody designed, and the obligation follows all of them.</p>

<div class="concept-box tip">
<h4>The two cloud-specific phases</h4>
<p>Transfer across borders and destruction are the two with no counterpart on premises, and both end in the division of responsibility: the provider can certify the platform, but knowing what data you hold and why is the customer's job.</p>
</div>

<h2>8.2 Identity and access management (IAM)</h2>

<h3>What IAM is</h3>
<div class="concept-box key">
<p>IAM is a framework of policies and technologies. It ensures that the right individuals get the right access to the right resources.</p>
</div>
<p>The <strong>core functions</strong> are authentication, authorisation, user management, policy enforcement and auditing:</p>

<table class="comparison-table">
<thead>
<tr><th>Function</th><th>What it does</th></tr>
</thead>
<tbody>
<tr><td><strong>Authentication</strong></td><td><strong>Verifies identity</strong> &mdash; the examples are username/password and multi-factor authentication (MFA).</td></tr>
<tr><td><strong>Authorization</strong></td><td>Defines permissions and actions &mdash; what an authenticated identity is allowed to do.</td></tr>
<tr><td><strong>User management</strong></td><td>Manages accounts, groups and roles. Roles matter more than individual accounts at cloud scale, because permissions are attached to roles and people are moved between them.</td></tr>
<tr><td><strong>Policy enforcement</strong></td><td><strong>Applies security policies</strong> &mdash; the "framework of policies" above made operative.</td></tr>
<tr><td>Audit and compliance</td><td>Logs and monitors activities &mdash; which is also what makes data lineage and SLA accounting possible.</td></tr>
</tbody>
</table>

<p>An identity that spans services illustrates IAM &mdash; a single set of fields (name, email, password, billing and shipping address, credit card) reused across providers, which is the practical face of federated identity and single sign-on on the cloud.</p>

<h3>Why IAM matters more in the cloud than on premises</h3>
<p>A familiar topic becomes a different problem in the cloud. Five reasons:</p>
<ol>
<li>The organisation's trust boundary becomes dynamic and moves beyond its control, extending into the service provider's domain. On premises, the firewall marked the edge of trust. Once workloads move to a provider, the boundary depends on the provider's configuration as well as the organisation's. That is de-perimeterisation made operational.</li>
<li>Managing access for diverse user populations &mdash; employees, contractors, partners and more.</li>
<li><strong>Increased demand for authentication</strong>, because personal, financial and medical data are involved and software applications hosted in the cloud require access control.</li>
<li><strong>Need for higher-assurance authentication</strong> &mdash; authentication in the cloud may mean authentication outside the firewall, where the protections of the internal network do not apply, and there are <strong>limits of password authentication</strong>.</li>
<li>Need for authentication from mobile devices &mdash; users authenticate from anywhere, over networks the organisation does not control.</li>
</ol>

<figure class="figure-wide figure-wrap">
<svg class="figure wide" viewBox="0 0 800 300" role="img" aria-label="The organisation's trust boundary used to stop at the firewall; in the cloud the boundary extends into the provider domain, so identity and access management becomes the control at the boundary">
<defs><marker id="f8b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="flow-arrow-head"/></marker></defs>

<text class="flow-label" x="185" y="26" text-anchor="middle">On premises: a fixed perimeter</text>
<rect class="flow-box phase1" x="30" y="44" width="310" height="120" rx="10"/>
<text class="flow-label" x="185" y="66" text-anchor="middle">Trust boundary = the firewall</text>
<rect class="flow-box phase2" x="52" y="80" width="120" height="40" rx="8"/><text class="flow-label" x="112" y="105" text-anchor="middle">Users</text>
<rect class="flow-box phase2" x="196" y="80" width="120" height="40" rx="8"/><text class="flow-label" x="256" y="105" text-anchor="middle">Resources</text>
<text class="flow-label" x="185" y="146" text-anchor="middle">Everything inside is trusted by location.</text>

<text class="flow-label" x="610" y="26" text-anchor="middle">Cloud: a boundary that moves</text>
<rect class="flow-box phase1" x="430" y="44" width="150" height="120" rx="10"/>
<text class="flow-label" x="505" y="66" text-anchor="middle">Organisation</text>
<rect class="flow-box phase2" x="452" y="80" width="106" height="40" rx="8"/><text class="flow-label" x="505" y="105" text-anchor="middle">Users</text>
<text class="flow-label" x="505" y="146" text-anchor="middle">no fixed edge</text>
<rect class="flow-box phase3" x="620" y="44" width="150" height="120" rx="10"/>
<text class="flow-label" x="695" y="66" text-anchor="middle">Provider domain</text>
<rect class="flow-box phase4" x="642" y="80" width="106" height="40" rx="8"/><text class="flow-label" x="695" y="105" text-anchor="middle">Resources</text>
<text class="flow-label" x="695" y="146" text-anchor="middle">controls are shared</text>

<path class="flow-arrow" d="M584,104 H616" marker-end="url(#f8b)"/>
<text class="flow-label" x="600" y="200" text-anchor="middle">The boundary now depends on the</text>
<text class="flow-label" x="600" y="220" text-anchor="middle">provider's configuration as well as yours.</text>
<text class="flow-label" x="600" y="248" text-anchor="middle">So the control has to be identity: authentication,</text>
<text class="flow-label" x="600" y="268" text-anchor="middle">authorisation and audit &mdash; not network location.</text>
</svg>
<figcaption>Fig 8.2 &mdash; Why IAM becomes the control when the perimeter moves. The organisation's <em>trust boundary becomes dynamic and moves beyond its control, extending into the service provider domain</em>. Once that is true, "inside the firewall" stops being a security property, and the only controls left are the ones that travel with the request: who is asking, what they are allowed to do, and the record of what they did.</figcaption>
</figure>

<h3>Authentication and authorisation, named</h3>
<p>The two halves of IAM are named by their abbreviations.</p>
<ul>
<li><strong>AuthN</strong> &mdash; authentication, answering <em>who is asking</em>: a username and password, multi-factor authentication, and the higher-assurance authentication that IAM's own reasons argue for.</li>
<li><strong>AuthZ</strong> &mdash; authorisation, answering <em>what that identity may do</em>: the permissions and actions IAM lists, arranged by role.</li>
</ul>
<p>The order between them is not optional. Authorisation means nothing for a caller whose identity is unknown, and authentication that is not followed by authorisation leaves a verified identity with everything. Authentication alone is not half of a control; it is none of one.</p>
<p>Authorisation is arranged by role, and that arrangement has a name: <strong>role-based access control</strong>, or RBAC. A user logs in with a specific role, and the role determines the protection domain the user operates in. One person may hold several roles at once &mdash; a department head, a project manager, a member of a hiring committee. The privileges they receive depend on which role they take at login, so changing role is how a person changes what they can reach. A role is a protection domain expressed as a group, which is what lets permissions scale where a per-user permission list does not.</p>
<p>The rule that keeps roles from being a labelling exercise is <strong>least privilege</strong>: an identity holds the permissions its function requires and no others. Cloud IAM has to enforce this rather than assume it, because a role attaches to a service account and to temporary credentials as readily as to a person. The practices are the IAM control area &mdash; deny-by-default, short-lived credentials and periodic access reviews. It is also why account hijacking and insider threats are described as hard to detect without least privilege.</p>

<h2>8.3 Service Level Agreements (SLA)</h2>

<h3>What an SLA is</h3>
<div class="concept-box key">
<p>An SLA is the service contract with the cloud service provider. SLAs provide a level of service for each service, specified in the form of a minimum level of service guaranteed and a target level, and they contain a number of performance metrics and the corresponding service objectives. It outlines the broad understanding between provider and consumer for conducting business and forms the basis for a mutually beneficial relationship. From a legal perspective, the terms and conditions that bind the service provider to provide services continually are formally defined in the SLA.</p>
</div>
<p>Two levels are the whole structure: a minimum guaranteed level and a target level. The target is what the provider aims for; the minimum is what it is contractually committed to, and the difference between them is where penalties live. In these terms: a <strong>metric</strong> is the quantity measured (availability, response time, throughput, mean time to recover) and a <strong>service objective</strong> is the number promised for it. So the smallest complete SLA statement has four parts &mdash; <em>which service</em>, <em>which metric</em>, <em>the guaranteed minimum</em>, <em>the target</em> &mdash; and the remedy if the minimum is missed.</p>

<table class="comparison-table">
<thead>
<tr><th>Term</th><th>What it names</th></tr>
</thead>
<tbody>
<tr><td><strong>SLI</strong> (service level indicator)</td><td>The quantity actually measured for one aspect of the service: response time, throughput, availability, error rate. It is a <em>metric</em>, measured rather than promised.</td></tr>
<tr><td><strong>SLO</strong> (service level objective)</td><td>The target set for one such quantity &mdash; availability of 99.9% for the month, say. It is a <em>service objective</em>: the number promised for a metric.</td></tr>
<tr><td><strong>SLA</strong> (service level agreement)</td><td>The contract that contains the objectives, the guaranteed minimum for each one and the remedy when a minimum is missed. It is the document, not the number.</td></tr>
</tbody>
</table>
<p>One service therefore has many indicators, each with an objective, and one agreement covering the set &mdash; which is why an SLA is quoted as a range of criteria rather than as a single figure.</p>

<p>Three details make that concrete. An SLA is per service, not per provider. One cloud account is usually covered by many agreements at once. A compute SLA, a storage SLA, a networking SLA, a support SLA, all applying at once, and the phrase <em>a level of service for each service</em> is the point: a failure can be covered by one and excluded by another. The remedy is usually service credit, not compensation. A provider that breaches a minimum typically issues credits against future billing rather than paying for your lost business, which is why an SLA prices risk instead of removing it &mdash; the outage still happens, and the credit is the provider's acknowledgement of it. And the agreement is legally binding: from a legal perspective the terms and conditions that bind the provider to provide services <em>continually</em> are formally defined in the SLA, which is why it is signed at procurement and quoted at dispute.</p>

<div class="concept-box tip">
<h4>What an SLA does not do</h4>
<p>It is a <strong>floor</strong>, not a description of normal operation. The minimum is chosen to be below what the provider actually expects to deliver, so meeting it does not mean the service was good &mdash; only that it was not in breach. One sentence says it cleanly: <em>an SLA defines the minimum acceptable service and the remedy when it is not met; it is a risk-allocation document rather than a guarantee of quality.</em></p>
</div>

<h3>The five SLA criteria</h3>
<table class="comparison-table">
<thead>
<tr><th>Criterion</th><th>Its detail</th></tr>
</thead>
<tbody>
<tr><td><strong>Availability</strong></td><td>Percentage of time the service is guaranteed to be available.</td></tr>
<tr><td><strong>Performance</strong></td><td>Response time, throughput.</td></tr>
<tr><td><strong>Disaster recovery</strong></td><td><strong>Mean time to recover.</strong></td></tr>
<tr><td><strong>Problem resolution</strong></td><td>Process to identify problems, support options, resolution expectations.</td></tr>
<tr><td>Security and privacy of data</td><td>Mechanisms for security of data in storage and transmission &mdash; which is data-at-rest and data-in-transit, written into the contract.</td></tr>
</tbody>
</table>
<p>Two connections between the phases. First, availability and performance in an SLA are the same quantities that the provisioning tension trades against: an SLA that guarantees CPU and memory for a preset period is what makes underprovisioning a penalty and overprovisioning a loss. Second, the security row makes the SLA a security document, not only a performance document.</p>

<p>The five rows group into three questions: <strong>what is delivered</strong> (availability, performance), what happens when the service fails (disaster recovery and mean time to recover, problem resolution), and <strong>what protects the data</strong> (security and privacy of data in storage and transmission). Only two of the five are about speed.</p>

<p>One number makes the availability row mean something. It is a percentage <em>of a period</em>, so it converts directly into downtime: 99.9% of a thirty-day month is about 43 minutes unavailable (43,200 minutes &times; 0.001), and 99.99% is about 4.3 minutes. Each additional nine cuts the allowed outage by roughly a factor of ten while the cost of engineering it does not. That is the whole reason providers publish tiers rather than one guarantee, and why the tier you buy is a business decision about how much downtime your application can survive.</p>

<p>Each of the other four rows is defined by the metric it names. <strong>Performance</strong> is response time and throughput, and it is the row an application actually feels: a service can be perfectly available and still too slow to use. Disaster recovery is measured as mean time to recover &mdash; how long a failure lasts, not how often it happens &mdash; which links directly to the availability percentage, because the two together fix how much of the month can be lost. Problem resolution is the contractual one rather than the technical one: the process for identifying problems, the support options you are entitled to, and the resolution expectations those carry. And security and privacy is the mechanisms for protecting data <em>in storage and transmission</em> &mdash; the two states written into the contract as an obligation rather than a practice.</p>

<h3>The five phases of the SLA life cycle</h3>
<p>An SLA goes through a sequence from identification of terms to termination. Both lists contain five phases, but they are not the same list &mdash; this one is about <strong>the contract</strong>:</p>
<table class="comparison-table">
<thead>
<tr><th>Phase</th><th>What happens</th></tr>
</thead>
<tbody>
<tr><td>1. Contract definition</td><td>Service providers define a set of service offerings and corresponding SLAs using standard templates. These service offerings form a catalog. Individual SLAs for enterprises can be derived by customising these base templates.</td></tr>
<tr><td>2. Publishing and discovery</td><td>The provider advertises these base service offerings through standard publication media, and customers should be able to locate the provider by searching the catalog. Customers can search different competitive offerings and shortlist a few that fulfil their requirements for further negotiation.</td></tr>
<tr><td>3. Negotiation</td><td>Once a provider meeting the hosting need is found, the SLA terms and conditions need to be mutually agreed before signing. For a standard packaged application offered as a service this phase could be automated; for customised applications hosted on cloud platforms it is manual. The provider needs to analyse the application's behaviour with respect to scalability and performance before agreeing on the SLA specification, and at the end of the phase the SLA is agreed and signed off. SLA negotiation can utilise WS-negotiation.</td></tr>
<tr><td>4. Operationalization</td><td>SLA operation consists of SLA monitoring, SLA accounting and enforcement. Monitoring involves measuring parameter values, calculating the metrics defined in the SLA and determining deviations, and on identifying deviations the concerned parties are notified. Accounting involves capturing and archiving SLA adherence for compliance, reporting the application's actual performance against the guaranteed performance, and stating the frequency and duration of each breach together with the penalties paid for each violation. Enforcement is taking appropriate action when runtime monitoring detects a violation &mdash; notifying parties, charging penalties and so on. Policies can be expressed using a subset of the Common Information Model (CIM), an open standard for expressing managed elements of a data centre through relationships and common objects.</td></tr>
<tr><td>5. De-commissioning</td><td>Termination of all activities performed under a particular SLA when the hosting relationship between provider and consumer has ended. The SLA specifies the terms and conditions of contract termination and the situations under which the relationship can be considered legally ended.</td></tr>
</tbody>
</table>
<h3>The five phases of SLA management in the cloud</h3>
<p>Where the SLA life cycle is the life of the contract, this is the life of <strong>the hosted application</strong> under it:</p>

<table class="comparison-table">
<thead>
<tr><th>Phase</th><th>What happens</th></tr>
</thead>
<tbody>
<tr><td>1. Feasibility</td><td>The managed service provider conducts a feasibility study of hosting the application on its cloud platform, covering three kinds of feasibility &mdash; technical, infrastructure and financial. Technical feasibility means determining the ability of the application to scale out, its compatibility with the cloud platform in the provider's data centre, the need and availability of specific hardware and software required to host and run it, and preliminary information about the application's performance and whether it can be met.</td></tr>
<tr><td>2. On-boarding</td><td>Once customer and provider agree in principle on the basis of the feasibility study, the application is moved from the customer's servers to the hosting platform &mdash; this is called on-boarding. As part of it, the provider understands the application's runtime characteristics using runtime profilers, which helps identify the SLAs that can be offered and create the policies (rule sets) required to guarantee the SLOs mentioned in the application SLA. The application becomes accessible to its end users only after on-boarding is complete.</td></tr>
<tr><td>3. Pre-production</td><td>The application is hosted in a simulated production environment, which lets the customer verify and validate the provider's findings on runtime characteristics and agree on the defined SLA. Once both parties agree on cost and terms, the customer signs off, and on successful completion the provider allows the application to go live.</td></tr>
<tr><td>4. Production</td><td>The application is made accessible to its end users under the agreed SLA. Situations can arise where the application behaves differently and causes a sustained breach, or the customer requests new terms. If the SLA is breached frequently, or the customer requests a new non-agreed SLA, the on-boarding process is performed again &mdash; in the first case to re-analyse the application and its policies, in the second to formulate a new set of policies for the fresh terms.</td></tr>
<tr><td>5. Termination</td><td>When the customer wishes to withdraw the hosted application the data is transferred back to the customer and only essential information is retained for legal compliance. This ends the hosting relationship for that application, and the customer's sign-off is obtained.</td></tr>
</tbody>
</table>
<div class="concept-box tip">
<h4>Two lists of five, and how they differ</h4>
<p><strong>SLA life cycle</strong> = contract definition &rarr; publishing and discovery &rarr; negotiation &rarr; operationalization &rarr; de-commissioning. <em>These are steps the contract takes.</em><br>
SLA management in the cloud = feasibility &rarr; on-boarding &rarr; pre-production &rarr; production &rarr; termination. <em>These are steps the application takes.</em><br>
The first list follows the contract; the second follows the application that runs under it, so an account of the contract takes the first and an account of hosting the application takes the second.</p>
</div>
<h2>8.4 Cloud vulnerabilities and risk mitigation</h2>

<p>Eight vulnerabilities, eight control areas, and one summary principle.</p>

<h3>The eight common vulnerabilities</h3>
<table class="comparison-table">
<thead>
<tr><th>Vulnerability</th><th>Description</th></tr>
</thead>
<tbody>
<tr><td><strong>Data breaches</strong></td><td>Unauthorized access to sensitive data due to misconfigured storage, weak access controls, or poor encryption. The example given is a publicly accessible object storage exposing customer records &mdash; which is an object-storage bucket with the wrong policy attached.</td></tr>
<tr><td><strong>Insecure APIs</strong></td><td>Weak authentication/authorisation or improper input validation in management APIs, which can be exploited for data exposure and privilege escalation. Every cloud service is an API, so the API surface <em>is</em> the attack surface.</td></tr>
<tr><td><strong>Misconfigurations</strong></td><td><strong>Human errors</strong> &mdash; overly permissive buckets, open security groups, weak firewall rules &mdash; which often lead to accidental exposure. This is a <em>human</em> category, not a technical one.</td></tr>
<tr><td><strong>Account hijacking</strong></td><td>Compromised credentials (phishing, brute force, token theft) enable attackers to abuse resources or exfiltrate data.</td></tr>
<tr><td><strong>DoS / DDoS</strong></td><td>Volumetric or application-layer attacks overwhelm services, causing downtime and unexpected scaling costs. The second half is the cloud-specific part: because capacity is elastic, an attack can be <em>billed to the victim</em> as well as disruptive.</td></tr>
<tr><td><strong>Insider threats</strong></td><td>Malicious or negligent insiders misuse legitimate access; hard to detect without strong monitoring and least privilege. This is the "trustworthiness of system administrators" listed under data remanence.</td></tr>
<tr><td><strong>Shared technology risks</strong></td><td>Multi-tenant infrastructure and hypervisor flaws may enable cross-tenant attacks if not patched and isolated properly. The statement of the threat is the same: malicious software can run on the same server, attack the hypervisor, and access or obstruct other VMs &mdash; and NoHype is the research response to it.</td></tr>
<tr><td><strong>Compliance / legal risks</strong></td><td>Data residency and regulatory requirements (GDPR, HIPAA) may be violated due to improper region selection or lack of controls. This is why regions and zones are a compliance decision and not only a latency one.</td></tr>
</tbody>
</table>

<h3>The eight mitigation control areas</h3>
<table class="comparison-table">
<thead>
<tr><th>Control area</th><th>Practices</th></tr>
</thead>
<tbody>
<tr><td><strong>Data security</strong></td><td>Encrypt data in transit and at rest; manage keys with KMS/HSM; apply tokenisation and anonymisation for sensitive fields.</td></tr>
<tr><td><strong>Identity &amp; access management</strong></td><td>Enforce least privilege; MFA for all users; short-lived credentials; RBAC/ABAC; periodic access reviews; deny-by-default. &mdash; the concrete practices behind 8.2's five functions.</td></tr>
<tr><td><strong>Secure APIs</strong></td><td>Use OAuth 2.0 / JWT; validate inputs and outputs; apply rate limiting and a WAF; log and monitor all API calls.</td></tr>
<tr><td><strong>Configuration management</strong></td><td>Continuous posture management (AWS Config, Azure Defender, GCP SCC); vulnerability scans; infrastructure-as-code with policy-as-code and pre-deployment checks. &mdash; the direct answer to misconfiguration.</td></tr>
<tr><td><strong>Threat detection &amp; monitoring</strong></td><td>Centralised logging and SIEM; anomaly detection; alerting on high-risk events; EDR for workloads.</td></tr>
<tr><td><strong>Resilience to DoS/DDoS</strong></td><td>CDN and Anycast; autoscaling; managed DDoS protection; WAF rules for layer 7; rate limiting and surge protection.</td></tr>
<tr><td><strong>Vendor &amp; shared responsibility</strong></td><td>Select certified providers (ISO 27001, SOC 2, FedRAMP); understand shared responsibilities; review SLAs and audit reports.</td></tr>
<tr><td><strong>Training &amp; awareness</strong></td><td>Regular security training; phishing simulations; secure coding programmes; incident response drills.</td></tr>
</tbody>
</table>

<h3>The shared responsibility model, and the summary principle</h3>
<div class="concept-box key">
<h4>The principle in one sentence</h4>
<p>Cloud platforms introduce unique risks, but a layered defence &mdash; encryption, strong IAM, secure APIs, continuous monitoring, configuration governance, DDoS resilience, vendor diligence and staff training &mdash; reduces exposure and supports compliance. Align controls to the shared responsibility model and your regulatory context.</p>
<p>The <strong>shared responsibility model</strong> is the division of duty: the provider is responsible for the security <em>of</em> the cloud (the physical facility, the hardware, the hypervisor and the managed services underneath). The customer is responsible for security <em>in</em> the cloud (their configuration, identities, data and code). It explains why misconfiguration and insecure APIs are the customer's fault even though the platform is the provider's: the provider secured the facility and the hypervisor, and left the bucket policy to whoever set it. That is why the vendor control area says <strong>understand shared responsibilities</strong>.</p>
</div>

<p>Which side of the line a control sits on depends on the service model, so the division reads differently at each level. The provider's side is security <em>of</em> the cloud and the customer's is security <em>in</em> the cloud; what changes is how much of the stack sits on each side:</p>

<table class="comparison-table">
<thead>
<tr><th>Service model</th><th>Provider secures</th><th>Customer secures</th></tr>
</thead>
<tbody>
<tr><td><strong>IaaS</strong></td><td>The facility, the hardware, the hypervisor and the virtualisation layer the VMs run on.</td><td>The guest operating system, the runtime and middleware, the application, the data and every identity that reaches it &mdash; most of the stack.</td></tr>
<tr><td><strong>PaaS</strong></td><td>All of that, plus the operating system, the runtime and the middleware the platform provides.</td><td>The application and its configuration, the data, the identities and their permissions.</td></tr>
<tr><td><strong>SaaS</strong></td><td>Everything the service runs on, including the application itself.</td><td>The data put into the service, the identities and their permissions, and the configuration of the service's own settings.</td></tr>
</tbody>
</table>

<p>Two things stay on the customer's side at every level, and they are the data and the identities. What moves is everything above them: at IaaS the customer patches the operating system, at PaaS the provider does, and at SaaS there is no operating system of the customer's to patch. That is the boundary 5.3 draws layer by layer, seen per service model instead of per layer.</p>

<h3>How the four sub-topics fit together</h3>
<p>The four sub-topics form a chain:</p>
<ol>
<li><strong>The risks</strong> &mdash; the eight vulnerabilities, and the exposures of the three data states.</li>
<li><strong>The data's own obligations</strong> &mdash; privacy and PII, retention, destruction, and the life cycle; compliance and residency, including the region decision.</li>
<li><strong>The controls</strong> &mdash; the eight control areas, with IAM from 8.2 as the identity control and encryption as the data control.</li>
<li><strong>The assurance</strong> &mdash; the SLA in 8.3, with its security-and-privacy criterion, its breach and penalty machinery, and the auditor who verifies it.</li>
<li><strong>The division of duty</strong> &mdash; the shared responsibility model, and de-perimeterisation, to explain why the boundary moved in the first place.</li>
</ol>

<p>Two of the challenges carry the most weight &mdash; <strong>shared responsibility</strong> and <strong>shared technology</strong>, because both are cloud-specific rather than general security.</p>

<p>For <strong>shared responsibility</strong>, the boundary between provider and customer is <em>drawn differently for each service model</em>, since the customer manages more in IaaS than in SaaS. It is <em>not always visible</em>, so a customer may believe a control exists when it is theirs to provide, or the reverse. That is why breaches so often trace to a misconfiguration rather than to a broken control. The two consequences are what make it a challenge rather than a division of labour: compliance and audit require knowing which side of the line each control sits on, and the provider can only <em>certify</em> its own side.</p>

<h3>The two challenges worked through</h3>
<table class="comparison-table">
<thead>
<tr><th>Challenge</th><th>Why it is a <em>cloud</em> challenge, and what mitigates it</th></tr>
</thead>
<tbody>
<tr><td>1. Multi-tenancy and shared technology</td><td>Several tenants share hardware and a hypervisor, so a hypervisor flaw can enable cross-tenant attacks (malicious software on the same server can attack the hypervisor and access or obstruct other VMs), and data from many companies being centralised makes the collection an attractive target, which also raises the importance of physical security and administrator trustworthiness. <em>Mitigation:</em> patching and isolation, least privilege, continuous monitoring, and provider certification.</td></tr>
<tr><td>2. Data confidentiality and the limits of control</td><td>The customer loses control of where data is and who can see it: data-at-rest is generally not encrypted because it is commingled with other users' data; governments may search data depending on where it resides; retention and destruction are governed by the provider's policy as much as the customer's, and replication makes proof of destruction hard. <em>Mitigation:</em> encryption in transit and at rest with managed keys, tokenisation, residency-aware region selection, contractual retention and deletion terms in the SLA, and audit.</td></tr>
</tbody>
</table>
<p>Both are among the challenges the unit names: data confidentiality and auditability, described as a serious problem, and security and confidentiality as a major concern for sensitive applications such as healthcare. <strong>Account hijacking</strong> and <strong>misconfiguration</strong> follow the same shape.</p>

<p class="past-pointer">Questions on this unit, with model answers, are on the <a href="#/ch/8/past">Past Questions</a> tab.</p>
`,

  revise: {"the-three-states-of-data-and-how-each-is-protected":"<p>Security covers four things, three of them the states data can be in.</p>\r\n<ul>\r\n<li><strong>Data-in-transit</strong> \u2014 confidentiality and integrity from a secured protocol (TLS) or from encrypting the payload.</li>\r\n<li><strong>Data-at-rest</strong> \u2014 generally not encrypted, being commingled with other users' data; encryption defeats indexing.</li>\r\n<li><strong>Data-in-use</strong> \u2014 processing, including multitenancy: the data must be readable, so platform trust is not replaced by cryptography.</li>\r\n<li><strong>Data lineage</strong> \u2014 when and where the data was: identifier, timestamp, endpoint.</li>\r\n</ul>\r\n<p><strong>Homomorphic encryption</strong> and <strong>predicate encryption</strong> aim at confidentiality and searchability together.</p>","data-provenance-the-question-security-cannot-answer":"<p><strong>Data provenance</strong> extends lineage into computational accuracy as well as data integrity.</p>\r\n<ul>\r\n<li>The exchange rate, the system's location and the state of the machine are all unverifiable to the customer.</li>\r\n<li>The workload ran on a machine the customer does not own, in a jurisdiction they may not know, at a time they cannot check.</li>\r\n<li><strong>Integrity of data</strong> is not <strong>integrity of computation</strong>: the bytes can be untouched while the result is wrong.</li>\r\n</ul>","data-remanence-and-the-provider-s-own-data":"<p><strong>Data remanence</strong> is the risk of inadvertent disclosure \u2014 data that remains where it was not intended to remain.</p>\r\n<ul>\r\n<li>It connects to storage virtualization: if you do not know which physical disks hold your blocks, proving a deleted copy is gone is harder.</li>\r\n<li><strong>Centralisation</strong>: quantities of data from many companies make the collection an attractive target for criminals.</li>\r\n<li>Physical security of the data centre and the trustworthiness of system administrators become the customer's risk.</li>\r\n</ul>","data-privacy":"<p>Privacy varies among countries, cultures and jurisdictions, shaped by public expectations and legal interpretations, so a concise definition is elusive.</p>\r\n<ul>\r\n<li>Privacy rights concern the collection, use, disclosure, storage and destruction of personal data (<strong>PII</strong>), and come down to accountability of organisations and transparency of their practices.</li>\r\n<li>The five concerns: <strong>storage</strong>, <strong>retention</strong>, <strong>destruction</strong>, <strong>auditing</strong> and breaches \u2014 with data residency among the storage questions.</li>\r\n</ul>","compliance-and-the-data-life-cycle":"<p><strong>Compliance</strong> is managed over a <strong>data life cycle</strong>, and two rules govern it: personal information is managed as part of the organisation's data, and protection must consider the cloud's impact at each phase.</p>\r\n<ul>\r\n<li>The seven phases: <strong>generation</strong>, <strong>transformation</strong>, <strong>transfer</strong>, <strong>use</strong>, <strong>storage</strong>, <strong>archival</strong>, <strong>destruction</strong>.</li>\r\n<li>The cloud changes the risk at each: transfer crosses legal regimes, use needs the data readable, and destruction is a request to a provider rather than an act.</li>\r\n</ul>","what-iam-is":"<p><strong>IAM</strong> is a framework of policies and technologies that ensures the right individuals get the right access to the right resources.</p>\r\n<ul>\r\n<li><strong>Authentication</strong> verifies identity (username/password, multi-factor authentication).</li>\r\n<li><strong>Authorization</strong> defines permissions and actions.</li>\r\n<li><strong>User management</strong> handles accounts, groups and roles \u2014 permissions attach to roles at cloud scale.</li>\r\n<li><strong>Policy enforcement</strong> applies the security policies; <strong>audit</strong> logs and monitors activity.</li>\r\n</ul>\r\n<p>One identity spanning services is federated identity and single sign-on in practice.</p>","why-iam-matters-more-in-the-cloud-than-on-premises":"<p>A familiar topic becomes a different problem in the cloud, for five reasons.</p>\r\n<ul>\r\n<li>The organisation's <strong>trust boundary</strong> becomes dynamic and moves beyond its control, into the provider's domain.</li>\r\n<li>Access must serve <strong>diverse user populations</strong> \u2014 employees, contractors, partners \u2014 with more authentication demanded.</li>\r\n<li><strong>Higher-assurance authentication</strong> is needed, as authentication may happen outside the firewall and passwords have limits.</li>\r\n<li>Users authenticate from <strong>mobile devices</strong>, over networks the organisation does not control.</li>\r\n</ul>\r\n<p>The control becomes identity rather than network location.</p>","authentication-and-authorisation-named":"<p>The order between the two halves of IAM matters.</p>\r\n<ul>\r\n<li><strong>AuthN</strong> \u2014 authentication, answering <em>who is asking</em>.</li>\r\n<li><strong>AuthZ</strong> \u2014 authorisation, answering <em>what that identity may do</em>; authentication without it leaves a verified identity with everything.</li>\r\n<li><strong>Role-based access control</strong> \u2014 a user logs in with a role, and the role determines the protection domain; one person may hold several roles at once.</li>\r\n<li><strong>Least privilege</strong> \u2014 an identity holds the permissions its function requires and no others, enforced by deny-by-default and short-lived credentials.</li>\r\n</ul>","what-an-sla-is":"<p>An <strong>SLA</strong> is the service contract with the provider: a guaranteed minimum level and a target level, with metrics and service objectives.</p>\r\n<ul>\r\n<li>A complete statement names the service, the metric, the minimum and the target, plus the remedy when the minimum is missed.</li>\r\n<li>An SLA is <strong>per service</strong>: compute, storage, networking and support agreements cover one account at once.</li>\r\n<li>The remedy is usually a <strong>service credit</strong>, not compensation for lost business.</li>\r\n</ul>\r\n<p>Meeting the minimum means no breach, not good service.</p>","the-five-sla-criteria":"<p>The five criteria, and what each measures:</p>\r\n<ul>\r\n<li><strong>Availability</strong> \u2014 percentage of time the service is guaranteed to be available.</li>\r\n<li><strong>Performance</strong> \u2014 response time and throughput.</li>\r\n<li><strong>Disaster recovery</strong> \u2014 mean time to recover.</li>\r\n<li><strong>Problem resolution</strong> \u2014 the process for identifying problems, support options and resolution expectations.</li>\r\n<li><strong>Security and privacy of data</strong> \u2014 mechanisms for data in storage and transmission.</li>\r\n</ul>\r\n<p>Availability is a percentage of a period: 99.9% of a thirty-day month is about 43 minutes, and 99.99% is about 4.3 minutes.</p>","the-five-phases-of-the-sla-life-cycle":"<p>The five phases of the contract's life, from identification of terms to termination:</p>\r\n<ul>\r\n<li><strong>Contract definition</strong> \u2014 offerings and SLAs defined from standard templates, forming a catalogue.</li>\r\n<li><strong>Publishing and discovery</strong> \u2014 the offerings are advertised and customers search the catalogue.</li>\r\n<li><strong>Negotiation</strong> \u2014 terms agreed and signed off.</li>\r\n<li><strong>Operationalization</strong> \u2014 SLA monitoring, accounting and enforcement, with policies expressible in CIM.</li>\r\n<li><strong>De-commissioning</strong> \u2014 termination of all activities under the SLA.</li>\r\n</ul>","the-five-phases-of-sla-management-in-the-cloud":"<p>This is the life of the hosted application rather than of the contract:</p>\r\n<ul>\r\n<li><strong>Feasibility</strong> \u2014 a study of technical, infrastructure and financial feasibility.</li>\r\n<li><strong>On-boarding</strong> \u2014 the application moves to the platform and is profiled to create policies for its SLOs.</li>\r\n<li><strong>Pre-production</strong> \u2014 a simulated production environment where the customer validates the findings.</li>\r\n<li><strong>Production</strong> \u2014 the application is live; sustained breaches return it to on-boarding.</li>\r\n<li><strong>Termination</strong> \u2014 data returns to the customer, with only essential information kept.</li>\r\n</ul>","the-eight-common-vulnerabilities":"<p>The eight vulnerabilities:</p>\r\n<ul>\r\n<li><strong>Data breaches</strong> \u2014 unauthorized access through misconfigured storage, weak access controls or poor encryption.</li>\r\n<li><strong>Insecure APIs</strong> \u2014 weak authentication or input validation; the API surface is the attack surface.</li>\r\n<li><strong>Misconfigurations</strong> \u2014 overly permissive buckets, open security groups, weak firewall rules.</li>\r\n<li><strong>Account hijacking</strong> \u2014 compromised credentials abused to exfiltrate data or abuse resources.</li>\r\n<li><strong>DoS / DDoS</strong> \u2014 elastic capacity means an attack can be billed to the victim.</li>\r\n<li><strong>Insider threats</strong>, <strong>shared technology risks</strong> and <strong>legal risks</strong> complete the eight.</li>\r\n</ul>","the-eight-mitigation-control-areas":"<p>The eight control areas, with their practices:</p>\r\n<ul>\r\n<li><strong>Data security</strong> \u2014 encrypt in transit and at rest; manage keys with KMS/HSM.</li>\r\n<li><strong>Identity &amp; access management</strong> \u2014 least privilege, MFA, short-lived credentials, deny-by-default.</li>\r\n<li><strong>Secure APIs</strong> \u2014 OAuth 2.0 / JWT, input validation, rate limiting, a WAF.</li>\r\n<li><strong>Configuration management</strong> \u2014 posture management, vulnerability scans, policy as code.</li>\r\n<li><strong>Threat detection &amp; monitoring</strong> \u2014 centralised logging and SIEM, anomaly detection.</li>\r\n<li><strong>DoS/DDoS</strong> resilience, <strong>vendor</strong> diligence and <strong>training</strong> make up the eight.</li>\r\n</ul>","the-shared-responsibility-model-and-the-summary-principle":"<p>The <strong>shared responsibility model</strong> is the division of duty.</p>\r\n<ul>\r\n<li>The provider secures <strong>the cloud</strong> \u2014 the physical facility, the hardware, the hypervisor and the managed services underneath.</li>\r\n<li>The customer secures <strong>in the cloud</strong> \u2014 their configuration, identities, data and code.</li>\r\n<li>That is why <strong>misconfiguration</strong> and insecure APIs are the customer's fault even though the platform is the provider's.</li>\r\n</ul>\r\n<p>The provider can certify the platform; knowing which side of the line each control sits on is the customer's job.</p>","how-the-four-sub-topics-fit-together":"<p>A long security question structures as a chain of five links:</p>\r\n<ul>\r\n<li>The risks \u2014 the eight vulnerabilities and the exposures of the four data states.</li>\r\n<li>The obligations \u2014 privacy and PII, retention, destruction, compliance and residency.</li>\r\n<li>The controls \u2014 the eight control areas, with IAM and encryption as the data controls.</li>\r\n<li>The assurance \u2014 the SLA, its breach and penalty machinery, and the auditor who verifies it.</li>\r\n<li>The division of duty \u2014 <strong>shared responsibility</strong> and de-perimeterisation.</li>\r\n</ul>\r\n<p><strong>Shared responsibility</strong> and <strong>shared technology</strong> carry the most weight.</p>","the-two-challenges-worked-through":"<p>Two challenges, each with its mechanism and its mitigation.</p>\r\n<ul>\r\n<li><strong>Multi-tenancy and shared technology</strong> \u2014 tenants share hardware and a hypervisor, so a hypervisor flaw can enable cross-tenant attacks, and centralised data makes the collection an attractive target. Mitigation: patching and isolation, least privilege, monitoring, provider certification.</li>\r\n<li><strong>Data confidentiality and the limits of control</strong> \u2014 data-at-rest is generally not encrypted, governments may search data by residency, and replication makes proof of destruction hard. Mitigation: encryption with managed keys, tokenisation, residency-aware regions, contractual retention and deletion terms, and audit.</li>\r\n</ul>"},
  pastSummary: `<h2>Exam-facing summary</h2>
<table class="comparison-table">
<thead>
<tr><th>If the question says&hellip;</th><th>Give&hellip;</th></tr>
</thead>
<tbody>
<tr><td>Explain data security in the cloud</td><td>The four aspects &mdash; data-in-transit (secured protocol, or encryption over a non-secured one, with confidentiality and integrity), data-at-rest (generally not encrypted because data is commingled; the indexing, homomorphic and predicate encryption questions), processing including multitenancy (data must be readable to be computed on), and data lineage (when and where, with the AWS d1/t1/endpoint example).</td></tr>
<tr><td>What is data provenance?</td><td>Computational accuracy as well as data integrity &mdash; the financial calculation example, the exchange-rate and location questions, and how a customer or auditor would verify the answer.</td></tr>
<tr><td>Discuss data privacy</td><td>The definition (varies by jurisdiction, so a concise definition is elusive; about collection, use, disclosure, storage and destruction of PII; accountability and transparency), then the five concerns with their questions: storage, retention, destruction, auditing/monitoring/risk management, and privacy breaches.</td></tr>
<tr><td>Explain compliance / the data life cycle</td><td>Personal information managed as part of organisational data, with cloud impact assessed per phase: generation, transformation, transfer, use, storage, archival, destruction (Fig 8.1).</td></tr>
<tr><td>What is IAM?</td><td>A framework of policies and technologies ensuring the right individuals get the right access to the right resources, with the five core functions and their details; then the four reasons it matters in the cloud &mdash; the dynamic trust boundary extending into the provider's domain, diverse user populations and increased demand for authentication, higher-assurance authentication outside the firewall with the limits of passwords, and authentication from mobile devices.</td></tr>
<tr><td>Explain the SLA</td><td>The definition (service contract; minimum guaranteed level and target level; performance metrics and service objectives; the legal terms binding continual service), the five criteria (availability, performance, disaster recovery, problem resolution, security and privacy of data), and then either the life cycle (contract definition, publishing and discovery, negotiation, operationalization, de-commissioning) or SLA management (feasibility, on-boarding, pre-production, production, termination) as the question requires.</td></tr>
<tr><td>Describe two challenges in ensuring cloud security (4 marks)</td><td>The two rows with mechanism, why the cloud worsens it, and the mitigation &mdash; or any two of the eight vulnerabilities with the same structure.</td></tr>
<tr><td>Cloud vulnerabilities and risk mitigation</td><td>The eight vulnerabilities and the eight control areas, then the summary principle and the shared responsibility model.</td></tr>
</tbody>
</table>


`,

  slides: `
<h2>The teacher's slides for this unit</h2>
<p class="ref-intro">These are the pictures that came with this unit &mdash; the class deck, the reference notes and the pages handed out with them &mdash; collected here so that the notes above read as writing rather than as a pile of screenshots. Each group is headed by the section of the notes its pictures belong to, in that order, and names the file and the slides they came from. The diagrams the notes themselves need are drawn in the notes.</p>

<h3>Compliance and the data life cycle</h3>

<p class="ref-meta">From <em>LectureNote_Ch _8.pptx</em>, slide 16.</p>

<!-- dcc-fig:ch8/lecturenote-ch-8-s16-149.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch8/lecturenote-ch-8-s16-149.webp" alt="Data life cycle (in Data Compliance)" width="638" height="401" loading="lazy" decoding="async">
<figcaption>Data life cycle (in Data Compliance)</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>What an SLA is</h3>

<p class="ref-meta">From <em>LectureNote_Ch _8.pptx</em>, slide 17.</p>

<!-- dcc-fig:ch8/lecturenote-ch-8-s17-150.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch8/lecturenote-ch-8-s17-150.webp" alt="Illustration for What an SLA is" width="1314" height="343" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch8/lecturenote-ch-8-s17-151.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch8/lecturenote-ch-8-s17-151.webp" alt="Illustration for What an SLA is" width="1065" height="214" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>The five SLA criteria</h3>

<p class="ref-meta">From <em>LectureNote_Ch _8.pptx</em>, slide 18.</p>

<!-- dcc-fig:ch8/lecturenote-ch-8-s18-152.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch8/lecturenote-ch-8-s18-152.webp" alt="Illustration for The five SLA criteria" width="753" height="301" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>The five phases of the SLA life cycle</h3>

<p class="ref-meta">From <em>LectureNote_Ch _8.pptx</em>, slides 19&ndash;21.</p>

<!-- dcc-fig:ch8/lecturenote-ch-8-s19-153.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch8/lecturenote-ch-8-s19-153.webp" alt="Illustration for The five phases of the SLA life cycle" width="1057" height="393" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch8/lecturenote-ch-8-s20-154.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch8/lecturenote-ch-8-s20-154.webp" alt="Illustration for The five phases of the SLA life cycle" width="1040" height="569" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch8/lecturenote-ch-8-s21-155.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch8/lecturenote-ch-8-s21-155.webp" alt="Illustration for The five phases of the SLA life cycle" width="1086" height="622" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>The five phases of SLA management in the cloud</h3>

<p class="ref-meta">From <em>LectureNote_Ch _8.pptx</em>, slides 22&ndash;24.</p>

<!-- dcc-fig:ch8/lecturenote-ch-8-s22-156.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch8/lecturenote-ch-8-s22-156.webp" alt="Illustration for The five phases of SLA management in the cloud" width="930" height="297" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch8/lecturenote-ch-8-s22-157.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch8/lecturenote-ch-8-s22-157.webp" alt="Illustration for The five phases of SLA management in the cloud" width="1073" height="448" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch8/lecturenote-ch-8-s23-158.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch8/lecturenote-ch-8-s23-158.webp" alt="Illustration for The five phases of SLA management in the cloud" width="1084" height="342" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch8/lecturenote-ch-8-s23-159.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch8/lecturenote-ch-8-s23-159.webp" alt="Illustration for The five phases of SLA management in the cloud" width="1058" height="246" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch8/lecturenote-ch-8-s24-160.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch8/lecturenote-ch-8-s24-160.webp" alt="Illustration for The five phases of SLA management in the cloud" width="1064" height="628" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->
`,
  quiz: [
    {
      q: 'Which statement about data-at-rest in the cloud is correct?',
      options: [
        'It is always encrypted by the provider',
        'It is generally not encrypted, since data is commingled with other users\' data',
        'It cannot be encrypted under any circumstances',
        'It is encrypted only when in transit as well'
      ],
      answer: 1,
      explanation: 'Data-at-rest is generally not encrypted because it is commingled with other users\' data, then raises the follow-on questions — encryption when the data is not associated with applications, and the effect on indexing and searching, with homomorphic and predicate encryption as the possible answers.'
    },
    {
      q: 'What is data lineage used for?',
      options: [
        'Compressing data before storage',
        'Knowing when and where data was located within the cloud, for audit and compliance purposes',
        'Encrypting data at rest',
        'Measuring the throughput of an SLA'
      ],
      answer: 1,
      explanation: 'The AWS example records each step as a data identifier, a timestamp and an endpoint: store <d1, t1, ex1.s3.amazonaws.com>, process <d2, t2, ec2.compute2.amazonaws.com>, restore <d3, t3, ex2.s3.amazonaws.com>.'
    },
    {
      q: 'Data provenance extends lineage to include:',
      options: [
        'Only the physical location of the disk',
        'Computational accuracy as well as data integrity',
        'The billing history of the account',
        'The encryption key rotation schedule'
      ],
      answer: 1,
      explanation: 'The example: a financial calculation that is correct assuming US dollars raises the questions of exchange rates, where the system was located, what state that physical system was in, and how a customer or auditor would verify it. Integrity of data is not integrity of computation.'
    },
    {
      q: 'Why is data destruction in the cloud difficult to prove?',
      options: [
        'Because providers refuse to delete data',
        'Because providers usually replicate data across multiple systems and sites, so you cannot know whether additional copies were retained',
        'Because deletion is illegal in some jurisdictions',
        'Because encrypted data cannot be deleted'
      ],
      answer: 1,
      explanation: 'The replication that gives cloud storage its availability is what makes proof of destruction hard: how do you know the provider did not retain additional copies, did it really destroy the data or merely make it inaccessible, and is it keeping the information longer to mine it?'
    },
    {
      q: 'Which is a core function of IAM?',
      options: [
        'Compression',
        'Authentication, authorization, user management, policy enforcement and auditing',
        'Backup and recovery only',
        'Network routing'
      ],
      answer: 1,
      explanation: 'IAM is a framework of policies and technologies ensuring that the right individuals get the right access to the right resources, with those five core functions: authentication (verifying identity, e.g. username/password or MFA), authorization (permissions and actions), user management (accounts, groups, roles), policy enforcement and audit/compliance logging.'
    },
    {
      q: 'Why does the organisation\'s trust boundary matter so much in cloud IAM?',
      options: [
        'Because it becomes static and easier to define',
        'Because it becomes dynamic and moves beyond the organisation\'s control, extending into the service provider domain',
        'Because it removes the need for authentication',
        'Because it eliminates the limits of password authentication'
      ],
      answer: 1,
      explanation: 'The first reason IAM matters: once the boundary extends into the provider\'s domain, location inside a firewall stops being a security property, and identity becomes the control.'
    },
    {
      q: 'Which is NOT one of the reasons IAM matters in cloud?',
      options: [
        'Managing access for diverse user populations such as employees, contractors and partners',
        'The need for higher-assurance authentication, because authentication in the cloud may mean authentication outside the firewall',
        'The need for authentication from mobile devices',
        'The removal of the need for auditing'
      ],
      answer: 3,
      explanation: 'Auditing remains a core IAM function. The reasons are the dynamic trust boundary, diverse user populations with increased demand for authentication (personal, financial and medical data, and cloud applications requiring access control), higher-assurance authentication with the limits of password authentication, and authentication from mobile devices.'
    },
    {
      q: 'An SLA specifies service levels as:',
      options: [
        'A single guaranteed level',
        'A minimum level of service guaranteed and a target level',
        'Only the price of the service',
        'Only the uptime percentage'
      ],
      answer: 1,
      explanation: 'An SLA is the service contract with the provider, giving a level of service for each service as a minimum guaranteed level and a target level, with a number of performance metrics and corresponding service objectives — and, legally, the terms and conditions binding the provider to provide services continually.'
    },
    {
      q: 'Which of these are the five SLA criteria?',
      options: [
        'Availability, performance, disaster recovery, problem resolution, security and privacy of data',
        'Price, region, instance type, storage class, support plan',
        'Authentication, authorization, auditing, retention, destruction',
        'Generation, transformation, transfer, storage, destruction'
      ],
      answer: 0,
      explanation: 'Availability (percentage of time the service is guaranteed to be available), performance (response time, throughput), disaster recovery (mean time to recover), problem resolution (process to identify problems, support options, resolution expectations) and security and privacy of data (mechanisms for security of data in storage and transmission).'
    },
    {
      q: 'What are the five phases of the SLA life cycle, in order?',
      options: [
        'Feasibility, on-boarding, pre-production, production, termination',
        'Contract definition, publishing and discovery, negotiation, operationalization, de-commissioning',
        'Generation, transformation, transfer, storage, destruction',
        'Design, build, test, deploy, retire'
      ],
      answer: 1,
      explanation: 'The SLA life cycle runs contract definition → publishing and discovery → negotiation → operationalization → de-commissioning. Feasibility, on-boarding, pre-production, production and termination are the five phases of SLA <em>management</em> in the cloud — a different list about the application rather than the contract.'
    },
    {
      q: 'In the SLA life cycle, what happens during operationalization?',
      options: [
        'The provider advertises its service offerings in a catalog',
        'SLA monitoring, accounting and enforcement',
        'The application is moved to the hosting platform',
        'The contract terms are negotiated'
      ],
      answer: 1,
      explanation: 'Operation consists of monitoring (measuring parameters, calculating metrics, determining and notifying deviations), accounting (capturing and archiving SLA adherence, reporting actual against guaranteed performance, and recording breach frequency, duration and penalties paid) and enforcement (notifying parties, charging penalties). Policies can be expressed using a subset of the Common Information Model (CIM).'
    },
    {
      q: 'In SLA management in the cloud, what is on-boarding?',
      options: [
        'Advertising the service in a catalog',
        'Moving the application from the customer\'s servers to the hosting platform, and profiling its runtime characteristics to identify the SLAs that can be offered',
        'Signing the final contract',
        'Terminating the relationship and returning the data'
      ],
      answer: 1,
      explanation: 'On-boarding moves the application to the provider\'s platform and uses runtime profilers to understand its characteristics, which helps identify the offerable SLAs and create the policies needed to guarantee the SLOs. The application becomes accessible to end users only after on-boarding completes.'
    },
    {
      q: 'Which mitigation practice belongs to the "Configuration management" control area?',
      options: [
        'Multi-factor authentication for all users',
        'Continuous posture management, vulnerability scans, and infrastructure-as-code with policy-as-code and pre-deployment checks',
        'CDN and Anycast',
        'Phishing simulations'
      ],
      answer: 1,
      explanation: 'Configuration management covers continuous posture management (AWS Config, Azure Defender, GCP SCC), vulnerability scans and IaC with policy-as-code and pre-deployment checks — the direct answer to the misconfiguration vulnerability. MFA belongs to IAM, CDN/Anycast to DDoS resilience, and phishing simulations to training and awareness.'
    },
    {
      q: 'Why is DDoS described as costing the victim money as well as causing downtime in the cloud?',
      options: [
        'Because providers charge a fine for attacks',
        'Because elastic capacity scales up in response to the attack, causing unexpected scaling costs',
        'Because the provider bills for bandwidth only during attacks',
        'Because the SLA guarantees no downtime'
      ],
      answer: 1,
      explanation: 'The reference sheet describes DoS/DDoS as volumetric or application-layer attacks that overwhelm services, causing downtime and unexpected scaling costs — the second half being cloud-specific, because autoscaling responds to the attack. Mitigations include CDN and Anycast, managed DDoS protection, layer-7 WAF rules, rate limiting and surge protection.'
    },
    {
      q: 'Which vulnerability involves human error such as overly permissive buckets, open security groups and weak firewall rules?',
      options: [
        'Account hijacking',
        'Misconfigurations',
        'Insider threats',
        'Insecure APIs'
      ],
      answer: 1,
      explanation: 'Misconfiguration is the human category, and it is the most common route to accidental exposure. Configuration management with posture management, policy-as-code and pre-deployment checks is the matching control area.'
    },
    {
      q: 'What does the shared responsibility model divide?',
      options: [
        'The cost between provider and customer',
        'Security of the cloud (provider) from security in the cloud (customer)',
        'The SLA penalties between the parties',
        'The data between regions'
      ],
      answer: 1,
      explanation: 'The provider is responsible for the physical facility, hardware, hypervisor and managed services underneath; the customer is responsible for their configuration, identities, data and code. It is why misconfiguration and insecure APIs remain the customer\'s responsibility even though the platform belongs to the provider — and why the control list says to understand shared responsibilities.'
    },
    {
      q: 'Why are shared technology risks a cloud-specific concern?',
      options: [
        'Because all tenants use the same password',
        'Because multi-tenant infrastructure and hypervisor flaws may enable cross-tenant attacks if not patched and isolated properly',
        'Because tenants share the same data by default',
        'Because providers publish their hypervisor source code'
      ],
      answer: 1,
      explanation: 'It is the same threat stated from the virtualization side: malicious software can run on the same server, attack the hypervisor and access or obstruct other VMs. Mitigations are patching, isolation, least privilege, continuous monitoring and provider certification.'
    },
    {
      q: 'A publicly accessible object storage bucket exposing customer records is the example given for which vulnerability?',
      options: [
        'Data breaches',
        'Compliance or legal risk',
        'DoS',
        'Insider threats'
      ],
      answer: 0,
      explanation: 'Data breaches are defined as unauthorized access to sensitive data due to misconfigured storage, weak access controls or poor encryption, with a publicly accessible object storage exposing customer records as the example — which is the misconfiguration category producing a breach, and why the categories overlap in practice.'
    }
  ],

  past: [
    {
      year: '2025 (expected)',
      marks: '6',
      repeats: 1,
      q: 'Discuss Data Privacy concerns in cloud computing.',
      occ: [
        { year: '2025 (expected)', marks: '6', q: 'Discuss Data Privacy concerns in cloud computing.' }
      ],
      answer: `
<h4>Model answer &mdash; 6 marks</h4>
<p>Privacy is the subset of security that is about <em>other people's</em> data and about the law,
and that is the distinction worth opening with: a security breach can be a privacy breach, but
privacy also covers what is lawfully done with data that never leaked.</p>
<ul>
<li><strong>Where the data physically is (data residency and sovereignty)</strong> &mdash; in a
cloud, storage location is a provider decision, and many jurisdictions require certain personal
data to remain inside their borders. An architecture that spans regions without a residency
policy can be unlawful without anyone doing anything wrong.</li>
<li><strong>The shared responsibility gap</strong> &mdash; the provider secures the infrastructure
and the customer secures the data, but the regulator holds the customer &mdash; as data
controller &mdash; accountable for both. This is the concern that catches most organisations.</li>
<li><strong>Multi-tenancy and the risk of exposure</strong> &mdash; shared hardware means a
misconfiguration or a side channel can expose one tenant's data to another, and the customer
cannot audit the isolation themselves.</li>
<li><strong>Secondary use and the training of models</strong> &mdash; data stored or processed by
third-party services may be used for provider analytics or to improve its models unless
contractually excluded. Privacy asks not only “is it safe” but “what else will it
be used for”.</li>
<li><strong>The right to erasure under multi-tenancy</strong> &mdash; deletion must reach
replicas, backups and caches, and proving that it did is genuinely hard in a distributed store,
which the unit's security deck treats as a problem in its own right.</li>
<li><strong>Access control and auditability</strong> &mdash; who inside the organisation can read
the data, and is there a record of who did.</li>
</ul>
<div class="concept-box tip">
<h4>Marking this one</h4>
<p>Predicted &mdash; from the previous site's “Teacher Notes / 2025 Expected” set, 6
marks. Residency, the responsibility gap and erasure are the three that are specific to the
cloud rather than to computing in general; an answer made of generic privacy concerns without
them reads as prepared for a different subject.</p>
</div>
`
    },
    {
      year: '2025 (expected)',
      marks: '6',
      repeats: 1,
      q: 'Explain Identity and Access Management (IAM) in cloud computing.',
      occ: [
        { year: '2025 (expected)', marks: '6', q: 'Explain Identity and Access Management (IAM) in cloud computing.' }
      ],
      answer: `
<h4>Model answer &mdash; 6 marks</h4>
<p><strong>IAM</strong> is the service that answers two questions for every request to a cloud
resource: <em>who is this</em> (authentication) and <em>what are they allowed to do</em>
(authorisation). Everything else in cloud security is built on its answers.</p>
<p><strong>What it is made of.</strong></p>
<ul>
<li><strong>Identity</strong> &mdash; a user, a group, or a machine identity (a service account or
an IAM role). The last of these matters most in a cloud, because workloads need credentials too.</li>
<li><strong>Policy</strong> &mdash; a document saying which actions on which resources are allowed
or denied to which principal. A <em>role</em> is a policy bundle that can be assumed temporarily.</li>
<li><strong>Federation and SSO</strong> &mdash; identities from an external directory (SAML, OIDC)
are trusted, so the company keeps one identity store and the cloud consumes it rather than
duplicating accounts.</li>
<li><strong>MFA</strong> &mdash; a second factor on every privileged action, which is the single
cheapest control against credential theft.</li>
</ul>
<p><strong>The principle to state explicitly: least privilege.</strong> A principal gets the
minimum permission needed for its task and nothing more, and temporary credentials are preferred
to long-lived keys. The cloud makes this more urgent than a single server does, because one
compromised administrative identity reaches every service in the account.</p>
<div class="concept-box tip">
<h4>Marking this one</h4>
<p>Predicted &mdash; from the previous site's “Teacher Notes / 2025 Expected” set, 6
marks. The two halves are the definition (authentication and authorisation) and the components.
Least privilege is the sentence that shows you understand why it exists rather than only what it
contains.</p>
</div>
`
    },
    {
      year: '2025 (expected)',
      marks: '8',
      repeats: 1,
      q: 'Discuss risk mitigation strategies for securing cloud environments.',
      occ: [
        { year: '2025 (expected)', marks: '8', q: 'Discuss risk mitigation strategies for securing cloud environments.' }
      ],
      answer: `
<h4>Model answer &mdash; 8 marks</h4>
<p>Each strategy answers one of the vulnerabilities above, and that pairing is the structure:</p>
<ul>
<li><strong>Identity and access management done first</strong> &mdash; least privilege, roles
rather than long-lived keys, MFA on every privileged account, and no shared credentials. This
is the single highest-value control because most breaches arrive through a credential.</li>
<li><strong>Encryption in transit and at rest, with key management</strong> &mdash; TLS between
everything, and provider-managed or customer-managed keys for stored data, so a stolen volume
is not a stolen dataset.</li>
<li><strong>Configuration baseline and continuous auditing</strong> &mdash; a hardened template,
then automated checks against it, because the failure mode is drift after the fact rather than
a decision at the start.</li>
<li><strong>Network segmentation</strong> &mdash; private subnets, security groups that deny by
default, and no data store reachable directly from the internet.</li>
<li><strong>Monitoring, logging and alerting</strong> &mdash; centralised audit logs with
detection rules. This is also the detection half of the answer: the controls above reduce the
probability, and this reduces the time to notice.</li>
<li><strong>Backups and tested restore</strong> &mdash; the only reliable answer to ransomware and
to accidental deletion, and a backup that has never been restored is not yet a control.</li>
<li><strong>Provider-side and contractual controls</strong> &mdash; the SLA, the audit rights, the
certifications (ISO 27001, SOC 2) and a documented shared-responsibility split. This is the
part the customer cannot do technically and must do contractually.</li>
<li><strong>People and process</strong> &mdash; training, an incident-response plan and a
disaster-recovery plan, because the controls are operated by humans under time pressure.</li>
</ul>
<div class="concept-box tip">
<h4>Marking this one</h4>
<p>Predicted &mdash; from the previous site's “Teacher Notes / 2025 Expected” set, 8
marks. Eight strategies is a mark each; an answer with four and a lot of prose about them is a
half answer. Group them as <em>prevent</em>, <em>detect</em>, <em>recover</em> and
<em>contract</em> and the structure itself carries marks.</p>
</div>
`
    },
    {
      year: '2025 (expected)',
      marks: '8',
      repeats: 1,
      q: 'Identify and explain four common cloud security vulnerabilities.',
      occ: [
        { year: '2025 (expected)', marks: '8', q: 'Identify and explain four common cloud security vulnerabilities.' }
      ],
      answer: `
<h4>Model answer &mdash; 8 marks</h4>
<p>Four vulnerabilities, two marks each: name it, then say why the cloud makes it worse or
easier to reach. The unit's deck lists exactly these.</p>
<ol>
<li><strong>Data breaches and data loss</strong> &mdash; unauthorised access to, or destruction
of, stored data. The cloud makes this worse because the data is reachable over the network
rather than behind a physical door, and because a single misconfigured bucket exposes it to the
whole internet rather than to one office.</li>
<li><strong>Misconfiguration and insecure interfaces</strong> &mdash; the dominant real-world
cause. APIs and consoles are the control surface, so an over-permissive API key or a public
storage bucket is a breach, and self-service means the customer's mistake becomes the
provider's incident. Shared-responsibility is the concept to name here: the provider secures
<em>of</em> the cloud, the customer secures what is <em>in</em> it.</li>
<li><strong>Account and credential compromise</strong> &mdash; stolen keys, weak identity
federation, or a single administrative account. The cloud concentrates privilege: one
compromised root credential reaches every service in the account, which is why IAM and MFA
matter more here than on a single server.</li>
<li><strong>Multi-tenancy and side-channel risk</strong> &mdash; several customers share the same
physical hardware through the hypervisor, so a hypervisor escape or a cache-timing side channel
can cross the tenant boundary. Isolation is only as strong as the hypervisor's, and it is the
risk the customer cannot audit.</li>
</ol>
<p>Two more worth a clause if there is room: <em>insider threat</em> at the provider, and
<em>denial of service</em> against a shared, metered service &mdash; which in a cloud also bills
the victim for the attack.</p>
<div class="concept-box tip">
<h4>Marking this one</h4>
<p>Predicted &mdash; the previous site's “Teacher Notes / 2025 Expected” set, 8 marks,
and the wording says “four”. Four named and explained beats six named and not
explained: the marks are in the explanation, and this is Unit 8's 8-mark unit on the paper, so
it is worth having the four crisp.</p>
</div>
`
    },
    {
      year: 'Model 2025',
      marks: '4',
      repeats: 1,
      q: 'Briefly describe two challenges in ensuring security in cloud environments.',
      occ: [
        { year: 'Model 2025', marks: '4', q: 'Briefly describe two challenges in ensuring security in cloud environments.' }
      ],
      answer: `
<h4>Model answer &mdash; 4 marks</h4>
<p><strong>Challenge 1 &mdash; multi-tenancy and shared technology.</strong> In the cloud <strong>several tenants share the same physical infrastructure and the same hypervisor</strong>, so the isolation between them is provided by software rather than by separate machines. The consequences are <strong>shared technology risks: multi-tenant infrastructure and hypervisor flaws may enable cross-tenant attacks if not patched and isolated properly</strong>. In the virtualization terms of Unit 6, <strong>malicious software can run on the same server, attack the hypervisor, and access or obstruct other VMs</strong> &mdash; which is exactly why the NoHype proposal removes the hypervisor altogether to leave nothing to attack. Centralisation compounds it: <strong>to the extent that quantities of data from many companies are centralised, this collection becomes an attractive target for criminals, and the physical security of the data centre and the trustworthiness of system administrators take on new importance.</strong> One incident can therefore affect many tenants at once, and both the physical facility and the provider's own staff become part of the customer's risk even though neither is under the customer's control.</p>
<p><em>Mitigation:</em> patching and isolation, <strong>least privilege</strong> with deny-by-default, continuous monitoring and logging, and selecting <strong>certified providers (ISO 27001, SOC 2, FedRAMP)</strong> while understanding the shared responsibility model.</p>

<p><strong>Challenge 2 &mdash; data confidentiality and the limits of the customer's control.</strong> Once data is in the cloud, the customer no longer controls where it is or who can see it. <strong>Data-at-rest is generally not encrypted, since data is commingled with other users' data</strong>, and even encrypting it is difficult without losing indexing and searching &mdash; which is why homomorphic and predicate encryption are research areas rather than defaults. For any application to process data, <strong>the data is not encrypted</strong>, so trust in the platform cannot be replaced by cryptography. On top of that, <strong>some governments may decide to search through data without notifying the data owner, depending on where the data resides</strong>; holders must ask <strong>whether the cloud provider itself has any right to see and access customer data</strong>; and <strong>retention and destruction are governed by the provider's policy as much as the customer's</strong> &mdash; and because <strong>providers usually replicate data across multiple systems and sites, it is hard to prove that a copy was really destroyed</strong> rather than merely made inaccessible.</p>
<p><em>Mitigation:</em> <strong>encrypt data in transit and at rest, manage keys with KMS/HSM, and apply tokenisation and anonymisation for sensitive fields</strong>; choose regions with regard to data residency and regulation (GDPR, HIPAA); and put retention and deletion terms, plus breach-notification duties, into the <strong>SLA</strong>, whose criteria include the <strong>mechanisms for security of data in storage and transmission</strong>.</p>

<p><strong>Either way, finish with the principle:</strong> cloud platforms introduce unique risks, but a <strong>layered defence</strong> &mdash; encryption, strong IAM, secure APIs, continuous monitoring, configuration governance, DDoS resilience, vendor diligence and staff training &mdash; reduces exposure and supports compliance, with controls aligned to the <strong>shared responsibility model</strong> and the applicable regulatory context.</p>

<div class="concept-box tip">
<h4>Where this came from</h4>
<p>Group B, question 12 of the <em>Model Question 2025</em>. The wording is <strong>"briefly describe two"</strong>, so two well-structured challenges with a mechanism, a reason the cloud makes it worse, and a mitigation will outscore eight names. Both challenges chosen above are the ones the course material itself flags: Unit 5's deck lists <em>data confidentiality and auditability</em> as "a serious problem" and security as a major concern for sensitive applications such as healthcare, and shared technology risk is stated in both the Chapter 6 deck and the vulnerabilities reference sheet.</p>
</div>`
    }
  ]
};
