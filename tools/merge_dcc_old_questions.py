#!/usr/bin/env python3
"""Fold the old site's questions into the DCC portal's past-question cards.

`tools/import_old_site_past.py` captured 33 cards from `dcc/dcc-website_v2/` as
evidence. `tools/audit_dcc_coverage.py` measures that 20 of them have no wording
match on the site. This tool closes that gap.

Two outcomes per old-site card, and the choice is made by hand rather than by
similarity, because similarity gets it wrong in both directions:

* **occ** — the same question asked in another paper, in that paper's own words.
  These belong in the existing card's `occ` list, which is what the site's
  "Same question in N papers - show each wording" trail reads. A Bulletin
  question with an example and an event sequence is the same 8-mark question as
  the one already there; a second card would split the trail in two.

* **new** — a question the site has no card for at all, which needs a real
  authored answer.

The answers are written against the notes in `dcc-site/`, which were written from
the decks and the books, NOT copied from the old site. The old site's answers are
short bullet lists (median 600 characters) and re-using them would put a visibly
thinner answer next to the ones already here. Where a question's provenance is a
prediction rather than a paper, the card says so - a guess at the paper is not
evidence of the paper.

    python tools/merge_dcc_old_questions.py --dry-run
    python tools/merge_dcc_old_questions.py
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / 'dcc-site'
MARK = '/* dcc-old-questions:merged */'

# Sources, spelled once. `paper` is a paper that was sat; `predicted` is a guess
# at one, and every card built on a prediction says which it is.
FINAL = 'Final 2025'
PREDICTED = '2025 (expected)'

# ---- the authored cards ------------------------------------------------------
# Keyed by unit. `occ` names the question already on the site that this one is
# another wording of; `new` carries an authored answer.
CARDS: dict[int, list[dict]] = {
    2: [
        {'old_q': 'Define RPC (Remote Procedure Call) and RMI (Remote Method Invocation).',
         'occ': 'Describe Remote Procedure Call (RPC) with its working mechanism.',
         'year': FINAL, 'marks': '2',
         'occ_q': 'Define RPC (Remote Procedure Call) and RMI (Remote Method Invocation).'},
    ],
    3: [
        {'old_q': 'Explain the Bully Election Algorithm with an example and event sequence.',
         'occ': 'Describe in detail the working and applications of the Bully election algorithm.',
         'year': FINAL, 'marks': '8',
         'occ_q': 'Explain the Bully Election Algorithm with an example and event sequence.'},
        {'old_q': 'List any two mutual exclusion algorithms.',
         'year': FINAL, 'marks': '2',
         'new': """
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
</div>"""},
    ],
    4: [
        {'old_q': 'Define Middleware. Explain the concepts related to CORBA with its architecture and services in detail.',
         'year': FINAL, 'marks': '8',
         'new': """
<h4>Model answer &mdash; 8 marks</h4>
<p><strong>Middleware</strong> is a software layer that sits between the applications and the
network and hides the heterogeneity of the machines underneath: different operating systems,
different programming languages and different data representations. It is what makes an
application portable across the nodes of a distributed system and interoperable with
applications on other nodes, without each application re-implementing the network itself.
Its other job is the one the unit's own heading uses &mdash; it is the layer that provides
distribution transparency.</p>
<p><strong>CORBA</strong> &mdash; the Common Object Request Broker Architecture, standardised by
the OMG &mdash; is object-based middleware. The application sees a set of remote objects with
interfaces written in <strong>IDL</strong> (Interface Definition Language), which is
language-neutral by design: the IDL is compiled into a stub in whatever language each side is
written in, and the wire format is agreed separately from both.</p>
<p><strong>The architecture, in one pass.</strong> A client holds an <strong>object
reference</strong> and calls a method on it through a <strong>client stub</strong> (proxy) that
marshals the arguments. The call reaches the <strong>ORB core</strong>, which is the bus: it
locates the object and transfers the request. On the server side the <strong>object
adapter</strong> (the portable POA) maps the reference onto an implementation and dispatches to
the <strong>skeleton</strong>, which unmarshals the arguments and invokes the real method. The
<strong>ORB</strong> itself is the middleware component that makes location transparent, and the
<strong>Interface Repository</strong> and <strong>Implementation Repository</strong> answer
"what does this interface look like" and "where is this object activated".</p>
<p><strong>Services</strong> are the standardised facilities layered above the ORB, of which the
examinable ones are: <em>naming</em> (bind names to object references, so a client does not
hard-code a location), <em>life cycle</em>, <em>trading</em> (find a service by its
properties rather than its name), <em>event</em> and <em>notification</em> (asynchronous
many-to-many delivery), and <em>transaction</em> (the two-phase commit that spans objects on
several hosts).</p>
<div class="concept-box tip">
<h4>Marking this one</h4>
<p>Group C, question 2 of the <em>2025 Final Exam</em>, 8 marks, and the wording lists its own
parts: definition, CORBA concepts, architecture, services. Treat it as four short answers.
The marks are lost by writing only the architecture &mdash; a page on the ORB and the POA with
nothing on naming or the transaction service cannot reach 8, because three of the four
requested parts are missing.</p>
</div>"""},
        {'old_q': 'Define transparency in DFS and explain naming transparency.',
         'year': FINAL, 'marks': '4',
         'new': """
<h4>Model answer &mdash; 4 marks</h4>
<p><strong>Transparency</strong> in a distributed file system is the property that the
distribution is invisible to the user: the file service behaves like a single local file
system even though the files are spread over several servers. The unit names the kinds worth
remembering &mdash; <em>access</em> (a local call and a remote one look the same),
<em>location</em> (you do not know where the file is), <em>migration</em>, <em>replication</em>
(copies exist but only one is visible), <em>concurrency</em> (two users' operations do not
interleave damagingly) and <em>failure</em>.</p>
<p><strong>Naming transparency</strong> is the specific case of <em>location</em>: the name a
client uses to open a file must not disclose, or depend on, the server that holds it. The unit
contrasts three schemes, and the examinable distinction is which of them is transparent:</p>
<ul>
<li><strong>Machine + path name</strong> (e.g. <code>/server/files/x.c</code> or a host in the
mount) &mdash; neither location transparent nor location independent: the server is named by the
client, and moving the file breaks every reference.</li>
<li><strong>Mounting a remote directory onto a local one</strong> &mdash; location transparent
once mounted, because the client sees a local path, but not location independent: the local
mount point still has to exist and be configured per client.</li>
<li><strong>A single global namespace</strong> (one NameNode, as in HDFS, or a single
<em>UFID</em>-based file service) &mdash; both location transparent and location independent:
the name is the same everywhere, and no client needs to know or be configured with a server.</li>
</ul>
<div class="concept-box tip">
<h4>Where this came from</h4>
<p>Group B, question 3 of the <em>2025 Final Exam</em>, 4 marks. The answer is marked in two
halves &mdash; the definition of transparency, then naming transparency with the three schemes
&mdash; and the third scheme's argument (location independent as well as transparent) is what
separates a 4 from a 2. The same distinction is section 4.1.4 of this unit's notes.</p>
</div>"""},
    ],
    5: [
        {'old_q': 'Explain the NIST definition of cloud computing and its five essential characteristics.',
         'year': PREDICTED, 'marks': '8',
         'new': """
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
site's \u201cTeacher Notes / 2025 Expected\u201d set, so treat it as a drill rather than
evidence. It is worth answering anyway, because the five characteristics are the part of the
syllabus that every cloud question is marked against. Five named characteristics with one
sentence each is the structure; the definition itself is the opening mark, and quoting its
distinctive phrases is how you show it is the NIST wording rather than a paraphrase.</p>
</div>"""},
        {'old_q': 'Compare IaaS, PaaS, and SaaS with suitable examples.',
         'year': PREDICTED, 'marks': '6',
         'new': """
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
<p>Predicted, not a past paper &mdash; from the previous site's \u201c2025 Exam / Expected\u201d
set. Six marks for three models: the table is two thirds of the answer and the sentence about
control moving with convenience is the rest. An answer that describes each model separately
without comparing them answers a different question.</p>
</div>"""},
        {'old_q': 'Explain the evolution of cloud computing from Mainframe to Cloud.',
         'year': PREDICTED, 'marks': '5',
         'new': """
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
<p>Predicted &mdash; from the previous site's \u201c2025 Exam / Expected\u201d set, 5 marks. Five
stages, five marks, one line each: this is deliberately a breadth question and time spent on
any one stage is time not spent on the others. The line that lifts it is the last one &mdash;
that the cloud's novelty is the interface and the billing, not the hardware.</p>
</div>"""},
    ],
    6: [
        {'old_q': 'Define Virtualization. Explain the role and types of Hypervisor.',
         'occ': 'Explain the difference between a hypervisor Type I and Type II.',
         'year': PREDICTED, 'marks': '6',
         'occ_q': 'Define Virtualization. Explain the role and types of Hypervisor.'},
        {'old_q': 'Compare Virtual Machines and Containers.',
         'year': PREDICTED, 'marks': '5',
         'new': """
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
<p>Predicted &mdash; from the previous site's \u201c2025 Exam / Expected\u201d set, 5 marks. Say
what is virtualised first; every other difference follows from it, and an answer that lists
five differences without naming that one has the detail but not the structure.</p>
</div>"""},
        {'old_q': 'Explain the Cloud Reference Architecture with a suitable diagram.',
         'year': PREDICTED, 'marks': '8',
         'new': """
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
<p>Predicted &mdash; the previous site lists it under \u201c2025 Exam / Expected\u201d, 8 marks,
and it says \u201cwith a suitable diagram\u201d. That phrase is an instruction: an unlabelled
diagram earns little and a labelled stack with the cross-cutting column earns most of it. Name
the layer, then say what it does in one clause &mdash; that is a mark per layer.</p>
</div>"""},
    ],
    7: [
        {'old_q': 'Differentiate between Object Storage and Block Storage in cloud computing.',
         'year': PREDICTED, 'marks': '5',
         'new': """
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
\u201cExpected\u201d. It sits in Unit 7's part of the syllabus (cloud platforms and services),
which is the unit with no lecture deck, so this card is written from the reference decks and
the textbooks like the rest of the unit.</p>
</div>"""},
    ],
    8: [
        {'old_q': 'Identify and explain four common cloud security vulnerabilities.',
         'year': PREDICTED, 'marks': '8',
         'new': """
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
<p>Predicted &mdash; the previous site's \u201cTeacher Notes / 2025 Expected\u201d set, 8 marks,
and the wording says \u201cfour\u201d. Four named and explained beats six named and not
explained: the marks are in the explanation, and this is Unit 8's 8-mark unit on the paper, so
it is worth having the four crisp.</p>
</div>"""},
        {'old_q': 'Discuss risk mitigation strategies for securing cloud environments.',
         'year': PREDICTED, 'marks': '8',
         'new': """
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
<p>Predicted &mdash; from the previous site's \u201cTeacher Notes / 2025 Expected\u201d set, 8
marks. Eight strategies is a mark each; an answer with four and a lot of prose about them is a
half answer. Group them as <em>prevent</em>, <em>detect</em>, <em>recover</em> and
<em>contract</em> and the structure itself carries marks.</p>
</div>"""},
        {'old_q': 'Explain Identity and Access Management (IAM) in cloud computing.',
         'year': PREDICTED, 'marks': '6',
         'new': """
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
<p>Predicted &mdash; from the previous site's \u201cTeacher Notes / 2025 Expected\u201d set, 6
marks. The two halves are the definition (authentication and authorisation) and the components.
Least privilege is the sentence that shows you understand why it exists rather than only what it
contains.</p>
</div>"""},
        {'old_q': 'Discuss Data Privacy concerns in cloud computing.',
         'year': PREDICTED, 'marks': '6',
         'new': """
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
contractually excluded. Privacy asks not only \u201cis it safe\u201d but \u201cwhat else will it
be used for\u201d.</li>
<li><strong>The right to erasure under multi-tenancy</strong> &mdash; deletion must reach
replicas, backups and caches, and proving that it did is genuinely hard in a distributed store,
which the unit's security deck treats as a problem in its own right.</li>
<li><strong>Access control and auditability</strong> &mdash; who inside the organisation can read
the data, and is there a record of who did.</li>
</ul>
<div class="concept-box tip">
<h4>Marking this one</h4>
<p>Predicted &mdash; from the previous site's \u201cTeacher Notes / 2025 Expected\u201d set, 6
marks. Residency, the responsibility gap and erasure are the three that are specific to the
cloud rather than to computing in general; an answer made of generic privacy concerns without
them reads as prepared for a different subject.</p>
</div>"""},
    ],
    9: [
        {'old_q': 'Explain Serverless Computing and its advantages.',
         'year': PREDICTED, 'marks': '4',
         'new': """
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
<p>Predicted &mdash; from the previous site's \u201cExpected / 2025 Exam\u201d set, 4 marks. Four
marks: the definition, then advantages. The definition is not complete without the billing
model, because pay-for-execution is what makes it serverless rather than merely managed.</p>
</div>"""},
        {'old_q': 'Compare Monolithic and Microservices architectures.',
         'year': PREDICTED, 'marks': '6',
         'new': """
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
<p>Predicted &mdash; from the previous site's \u201cExpected / 2025 Exam\u201d set, 6 marks. A
comparison, so an answer that describes both without contrasting them loses the marks that are
for the comparison. The trade-off sentence is what stops it reading as advocacy.</p>
</div>"""},
        {'old_q': 'Explain Edge Computing and Fog Computing. How do they differ from Cloud Computing?',
         'year': PREDICTED, 'marks': '5',
         'new': """
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
<p>Predicted &mdash; from the previous site's \u201cExpected / 2025 Exam\u201d set, 5 marks. Two
definitions and the contrast; the tier framing (cloud top, fog middle, edge bottom) is the
sentence that shows the three are one architecture rather than three unrelated ideas.</p>
</div>"""},
        {'old_q': 'What is Kubernetes? Explain its role in container orchestration.',
         'year': PREDICTED, 'marks': '5',
         'new': """
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
<p>Predicted &mdash; from the previous site's \u201cExpected / 2025 Exam\u201d set, 5 marks. The
definition is one mark; the rest are for the roles, so name them as roles rather than listing
features. Kubernetes appears in the syllabus beside Docker and microservices, so the answer is
better when it says what it lets a microservices architecture <em>do</em>.</p>
</div>"""},
    ],
}

# ---- merging ----------------------------------------------------------------


def qstr(text: str) -> str:
    """Quote a string the way the chapter files do.

    A question containing an apostrophe cannot live in a single-quoted JS string,
    so it is written with double quotes - which is why ch3's Lamport card is
    double-quoted on disk, and why a matcher that reads only single quotes
    misses it.
    """
    return '"' + text + '"' if "'" in text else "'" + text + "'"


def new_card(card: dict) -> str:
    q, year, marks = card['old_q'], card['year'], card['marks']
    occurrence = '        { year: ' + qstr(year) + ', marks: ' + qstr(marks) + ', q: ' + qstr(q) + ' }'
    return ('    {\n'
            '      year: ' + qstr(year) + ',\n'
            '      marks: ' + qstr(marks) + ',\n'
            '      repeats: 1,\n'
            '      q: ' + qstr(q) + ',\n'
            '      occ: [\n' + occurrence + '\n'
            '      ],\n'
            '      answer: `\n' + card['new'].strip() + '\n`\n'
            '    },\n')


def add_occurrence(text: str, card: dict) -> tuple[str, str | None]:
    """Append another paper's wording to an existing card's occurrence trail.

    The trail is what the site's "Same question in N papers" disclosure reads, so
    a second wording belongs here and not in a second card - two cards for one
    question split the trail in two and both look half-answered.
    """
    anchor = 'q: ' + qstr(card['occ'])
    i = text.find(anchor)
    if i < 0:
        return text, f'could not find the card for {card["occ"][:44]!r}'
    occ_at = text.find('occ: [', i)
    if occ_at < 0:
        return text, 'that card has no occ list to extend'

    # repeats first: the edit is before the insertion point, so the occ offsets
    # have to be found again after it rather than adjusted.
    last = None
    for m in re.finditer(r'repeats: (\d+)', text[:occ_at]):
        last = m
    if last:
        text = text[:last.start()] + f'repeats: {int(last.group(1)) + 1}' + text[last.end():]
        i = text.find(anchor)
        occ_at = text.find('occ: [', i)

    close = text.find('\n      ]', occ_at)
    if close < 0:
        return text, 'could not find the end of the occ list'
    entry = (',\n        { year: ' + qstr(card['year']) + ', marks: ' + qstr(card['marks'])
             + ', q: ' + qstr(card['occ_q']) + ' }')
    return text[:close] + entry + text[close:], None


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--dry-run', action='store_true', help='describe, write nothing')
    args = ap.parse_args()

    changed = 0
    for unit in sorted(CARDS):
        path = SITE / f'ch{unit}.js'
        original = path.read_text(encoding='utf-8')
        text = original
        if '  past: [' not in text:
            print(f'  ch{unit}  no past array')
            continue
        for card in CARDS[unit]:
            wanted = card.get('occ_q', card['old_q'])
            if 'q: ' + qstr(wanted) in text:
                print(f'  ch{unit}  already present: {wanted[:52]}')
                continue
            if 'occ' in card:
                text, problem = add_occurrence(text, card)
                if problem:
                    print(f'  ch{unit}  FAILED: {problem}')
                    continue
                print(f'  ch{unit}  + occurrence on "{card["occ"][:44]}"')
            elif '  past: []' in text:
                # A chapter with nothing to show for this paper carries the empty
                # array, so the first card has to replace it rather than be
                # inserted into it - inserting leaves `past: [` with no `]`.
                text = text.replace('  past: []',
                                    '  past: [\n' + new_card(card) + '  ]', 1)
                print(f'  ch{unit}  + first card, {card["marks"]}m: {card["old_q"][:50]}')
            else:
                at = text.index('  past: [\n') + len('  past: [\n')
                text = text[:at] + new_card(card) + text[at:]
                print(f'  ch{unit}  + new card, {card["marks"]}m: {card["old_q"][:52]}')
        if text != original:
            changed += 1
            if not args.dry_run:
                path.write_text(text, encoding='utf-8')
    print()
    print(f'{changed} chapter file(s) {"would change" if args.dry_run else "changed"}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
