# DCC Study Portal — Content Re-engineering & Rewrite Plan (`planimp.md`)

> **Document Goal:** Provide a concrete, actionable, chapter-by-chapter plan to transform the Distributed & Cloud Computing (DCC) content from verbose, essay-style DeepSeek V1 text into clean, high-yield, exam-focused study notes matching the high standard of the Simulation portal.

---

## 1. Executive Summary & Problem Diagnosis

### The Core Issue
The current DCC content in `dcc-site/ch1.js` through `ch9.js` was produced by dumping raw lecture notes into DeepSeek V1. While previous passes added HTML wrappers (`example-box`, `concept-box`, `comparison-table`), the **underlying text remained an academic essay**.

### Side-by-Side Comparison: Simulation vs. DCC

| Feature | Simulation Portal (The Good Model) | DCC Portal (Current Flawed Content) |
| :--- | :--- | :--- |
| **Writing Style** | Crisp, concise, high-yield engineering study notes. | Conversational academic essay, philosophical commentary. |
| **Definitions** | Direct, formulaic (e.g., `Simulation = Model + Experimentation`). | Multi-paragraph text discussing who defined what and why. |
| **Formatting** | Punchy bullet points, bold key terms, minimal cognitive load. | Dense prose blocks (100–250 words) with filler phrases. |
| **Exam Suitability** | Structured for 4-mark and 8-mark university questions. | Hard to memorize; students cannot easily extract answer points. |
| **Examples** | Tabular, concrete mappings (e.g., Banking System: Entity, Attribute, Event). | Abstract philosophical mentions embedded inside running prose. |
| **Tone** | "Here is what this is, how it works, and how to write it in an exam." | "Notice the subtle distinction and why historical authors argued this." |

### Why the Current DCC Text Fails Students
1. **Academic Meta-Commentary:** Riddled with commentary like:
   - *"Both halves of the first definition carry weight, and each does a separate job..."*
   - *"The fact that explains a lot of computing history..."*
   - *"Tanenbaum's framing is the useful one: taking the data centre as the core..."*
   - *"The two columns are the same properties seen from opposite sides..."*
   *Fix:* Cut all conversational meta-chatter. Give the definition and the facts directly.
2. **Dense Paragraph Walls:** Important properties (scalability, security, transparency) are buried in continuous text rather than structured lists.
3. **Missing Exam Architecture:** Students taking Purbanchal University exams need:
   - Clear definition (1–2 sentences)
   - Core components / architecture diagram (ASCII/SVG/bullet schema)
   - Working steps (Numbered 1, 2, 3...)
   - Advantages vs. Disadvantages (Clean 2-column or bulleted contrast)
   - Real-world example (e.g., GFS, AWS EC2, RPC)

---

## 2. The Rewrite Style Guide ("Simulation Standard")

For every topic across all 9 chapters, the text will follow this strict template:

```html
<!-- 1. DEFINITION BLOCK -->
<h3>X.Y [Topic Name]</h3>
<p><strong>[Term]</strong> is [direct, 1-2 sentence definition without filler].</p>
<div class="concept-box key">
  <h4>Core Concept / Formula</h4>
  <p><strong>[Key takeaway formula or golden rule]</strong></p>
</div>

<!-- 2. STRUCTURED CHARACTERISTICS / COMPONENTS -->
<p><strong>Key Characteristics / Components:</strong></p>
<ul>
  <li><strong>[Component 1]:</strong> [15-word clear description].</li>
  <li><strong>[Component 2]:</strong> [15-word clear description].</li>
  <li><strong>[Component 3]:</strong> [15-word clear description].</li>
</ul>

<!-- 3. HOW IT WORKS (STEP-BY-STEP) -->
<p><strong>Working Mechanism:</strong></p>
<ol>
  <li><strong>Step 1 (Initiation):</strong> [What happens first].</li>
  <li><strong>Step 2 (Transmission):</strong> [What moves over the network].</li>
  <li><strong>Step 3 (Processing):</strong> [How the receiver handles it].</li>
  <li><strong>Step 4 (Completion):</strong> [Final outcome / reply].</li>
</ol>

<!-- 4. CLEAN COMPARISON / TRADEOFF TABLE -->
<table class="comparison-table">
  <thead>
    <tr><th>Feature</th><th>Approach A</th><th>Approach B</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Definition</strong></td><td>...</td><td>...</td></tr>
    <tr><td><strong>Cost / Overhead</strong></td><td>...</td><td>...</td></tr>
    <tr><td><strong>Example</strong></td><td>...</td><td>...</td></tr>
  </tbody>
</table>

<!-- 5. REAL-WORLD CONCRETE EXAMPLE BOX -->
<div class="example-box">
  <h4>Example: [System Name]</h4>
  <p><strong>Context:</strong> [Where used]</p>
  <p><strong>How it applies:</strong> [Direct mapping of concepts to this system]</p>
</div>
```

---

## 3. Chapter-by-Chapter Content Rewrite Plan

### Unit 1: Introduction to Distributed Systems (Syllabus: 6 Marks)
* **Current State:** 64KB file. Overly philosophical about the definition of distributed systems and Tanenbaum vs. Coulouris.
* **Target Changes:**
  1. **Definition (§1.1):** Replace the 4 paragraphs of commentary with 1 crisp definition, 1 key concept box (`Distributed System = Autonomous Nodes + Message Passing + Single Coherent Illusion`).
  2. **Characteristics (§1.1.1–§1.1.2):** Reformat concurrency, no global clock, and independent failure into 3 distinct punchy sections with bulleted impacts.
  3. **Goals & Transparency (§1.2):** Reorganize the 8 transparency types (Access, Location, Migration, Relocation, Replication, Concurrency, Failure, Persistence) into a clean, memorize-friendly cheat sheet table.
  4. **System Models (§1.4):** Simplify Architectural Models (Client-Server, Peer-to-Peer, Tiered) into clear structural bullets with pros/cons.

### Unit 2: Communication in Distributed Systems (Syllabus: 10 Marks — Heaviest Unit)
* **Current State:** 125KB file. RPC mechanism and RMI are covered in long discursive paragraphs.
* **Target Changes:**
  1. **Layered Protocols & IPC (§2.1):** Summarize message passing primitives (Send/Receive, Blocking vs. Non-blocking, Synchronous vs. Asynchronous) into a comparison matrix.
  2. **Remote Procedure Call (RPC) (§2.2):**
     - Strip conversational filler from the 10-step RPC flow.
     - Rewrite the 10 steps into a clear, numbered sequence: `1. Client calls stub` &rarr; `2. Stub marshals params` &rarr; `3. OS sends packet` &rarr; `4. Server OS receives` &rarr; `5. Server stub unmarshals` &rarr; `6. Server executes procedure` &rarr; `7. Server stub marshals result` &rarr; `8. Server OS sends` &rarr; `9. Client OS receives` &rarr; `10. Client stub unmarshals and returns`.
     - Add a `.worked` step block summarizing failure semantics (At-least-once, At-most-once, Exactly-once).
  3. **Remote Method Invocation (RMI) (§2.3):** Direct contrast table between RPC and RMI (Language dependence, Object identity, Garbage collection).
  4. **Message-Oriented & Stream Communication (§2.4–§2.5):** Clear bullet points for Queuing models and QoS parameters (Jitter, Latency, Bandwidth).

### Unit 3: Synchronization and Coordination (Syllabus: 6 Marks)
* **Current State:** 105KB file. Math and clock offset derivations are good, but election algorithms and mutual exclusion are dense.
* **Target Changes:**
  1. **Clock Synchronization (§3.1):**
     - Cristian's Algorithm: Provide clear numbered algorithm steps followed by the formula `T_client = T_server + (T_round / 2)`.
     - Berkeley Algorithm: Clear 4-step master/slave averaging sequence.
     - NTP: Stratum hierarchy clearly bulleted (Stratum 0, 1, 2).
  2. **Logical Clocks (§3.2):**
     - Lamport's Clocks: State the exact 2 rules (Rule 1: Internal increment; Rule 2: Message piggyback increment) in simple pseudocode boxes.
     - Vector Clocks: State why Lamport fails (cannot detect causality vs concurrency) and write the vector update rule simply.
  3. **Mutual Exclusion (§3.3):**
     - Clean comparison table: Centralized vs. Distributed (Ricart-Agrawala) vs. Token Ring (Message complexity, Delay before entry, Single point of failure).
  4. **Election Algorithms (§3.4):**
     - Bully Algorithm: 5 clear rules + step-by-step failure recovery walkthrough.
     - Ring Algorithm: Token circulation and largest-ID election in 4 clean steps.

### Unit 4: Distributed File Systems & Middleware (Syllabus: 6 Marks)
* **Current State:** 130KB file. NFS, HDFS, GFS, and CORBA are bogged down in massive historical text blocks.
* **Target Changes:**
  1. **DFS Architecture (§4.1):** Flat file service vs. Directory service vs. Client module — clear tabular responsibilities.
  2. **SUN NFS (§4.2.1–§4.2.3):**
     - Stateless architecture: 4 reasons why stateless design was chosen (Crash recovery simplicity, no open file tables, idempotent operations).
     - Close-to-open consistency: 3 clear bullets on how caching works and why 30s window exists.
  3. **HDFS & GFS (§4.2.4–§4.2.9):**
     - Master/Worker architecture: NameNode + DataNodes (HDFS) / Master + Chunkservers (GFS).
     - Replication strategy: 3-replica rack-aware placement rule formatted as steps.
     - Read/Write path: Numbered 1 to 5 flow.
  4. **Middleware (CORBA, Java RMI, MQTT, AMQP) (§4.3):**
     - Remove the dense historical narrative on OMG/CORBA.
     - Replace with: What is an ORB? What is IDL? What is IIOP?
     - Contrast MQTT (lightweight, IoT, pub/sub) vs. AMQP (enterprise, queues, routing keys).

### Unit 5: Introduction to Cloud Computing (Syllabus: 6 Marks)
* **Current State:** 92KB file. Discusses history and economics in long unbroken paragraphs.
* **Target Changes:**
  1. **Cloud Definition & NIST Essential Characteristics (§5.1–§5.2):**
     - 5 NIST characteristics (On-demand self-service, Broad network access, Resource pooling, Rapid elasticity, Measured service) rewritten into crisp 2-sentence items.
     - Scalability vs Elasticity: Clear contrasting definition box.
  2. **Service Models (IaaS, PaaS, SaaS) (§5.3):**
     - Provide the "Shared Responsibility" stack table: Who manages Networking, Storage, Servers, Virtualization, OS, Middleware, Runtime, Data, Applications.
     - Pizza-as-a-Service analogy kept clean and concise.
  3. **Deployment Models (§5.4):** Public, Private, Hybrid, Community — 4-column feature table (Ownership, Infrastructure location, Security, Cost).

### Unit 6: Virtualization and Cloud Architecture (Syllabus: 8 Marks)
* **Current State:** 107KB file. Type 1 vs Type 2 table is good, but CPU, Memory, and I/O virtualization sections are too wordy.
* **Target Changes:**
  1. **Hypervisors (§6.1):** Type 1 (Bare-metal) vs. Type 2 (Hosted) — performance, architecture, examples (ESXi/KVM vs. VirtualBox/VMware Workstation).
  2. **Resource Virtualization (§6.1.6–§6.1.8):**
     - CPU: Popek-Goldberg virtualization requirements (Privileged vs Sensitive instructions) in plain English.
     - Memory: Two-stage address translation (VA &rarr; PA &rarr; MA) with nested page tables (EPT/NPT).
     - I/O: Emulation vs. Paravirtualization vs. Direct Pass-through (SR-IOV).
  3. **Containers vs. VMs (§6.2):** Definitive side-by-side comparison (Kernel sharing, boot time, disk footprint, isolation level).

### Unit 7: Cloud Platforms and Technologies (Syllabus: 6 Marks)
* **Current State:** 71KB file. Contains notes explaining missing slides rather than direct study content.
* **Target Changes:**
  1. **Platform Matrix (§7.1):** AWS vs. Azure vs. GCP across Compute (EC2 vs. Azure VM vs. GCE), Storage (S3 vs. Blob vs. Cloud Storage), Database (RDS/DynamoDB vs. Azure SQL/Cosmos vs. Cloud SQL/Spanner), Serverless (Lambda vs. Functions vs. Cloud Functions).
  2. **Storage Services Deep Dive (§7.2):**
     - Object vs. Block vs. File storage comparison table.
     - S3 mechanics: Buckets, Keys, Metadata, REST API operations (GET/PUT/DELETE), 11-nines durability explanation.
  3. **Compute Services (§7.3):**
     - EC2 instance lifecycle, purchasing models (On-Demand, Reserved, Spot, Savings Plans).
     - Serverless execution model: Trigger &rarr; Ephemeral Container &rarr; Execution &rarr; Scale to Zero.

### Unit 8: Security and Challenges in Cloud (Syllabus: 8 Marks)
* **Current State:** 93KB file. Dense legal and philosophical discussions of privacy.
* **Target Changes:**
  1. **Data Security States (§8.1.1):** Data-at-rest, Data-in-transit, Data-in-use — cryptographic controls and challenges for each.
  2. **Data Life Cycle (§8.1.5):** 7 phases (Generation, Transformation, Transfer, Use, Storage, Archival, Destruction) converted into a crisp table with cloud security threats per phase.
  3. **IAM (§8.2):** Authentication (AuthN) vs. Authorization (AuthZ), RBAC (Role-Based Access Control), Multi-Factor Authentication (MFA), Principle of Least Privilege.
  4. **Service Level Agreements (SLAs) (§8.3):**
     - SLA vs. SLO vs. SLI definitions.
     - Calculation formula: Availability percentage & uptime downtime allowance (99.9% vs 99.99%).
  5. **Cloud Threats & Shared Responsibility Model (§8.4):** Provider responsibility (Security OF the Cloud) vs. Customer responsibility (Security IN the Cloud) for IaaS, PaaS, SaaS.

### Unit 9: Emerging Trends (Syllabus: 4 Marks)
* **Current State:** 82KB file. High quality technical ideas, but paragraphs are unnecessarily long.
* **Target Changes:**
  1. **Edge & Fog Computing (§9.1):** Cloud vs. Fog vs. Edge tiering table (Latency, Node count, Bandwidth load, Suited applications).
  2. **Serverless & FaaS (§9.2):** Cold starts, execution caps, statelessness, event sources.
  3. **Docker & Kubernetes (§9.3):**
     - Docker building blocks: cgroups (resource isolation), namespaces (process/network isolation), layered filesystem.
     - Kubernetes architecture: Master components (API Server, etcd, Scheduler, Controller Manager) vs. Node components (kubelet, kube-proxy, Container runtime).

---

## 4. Implementation Methodology & Execution Sequence

To execute this plan smoothly without breaking the site or causing token truncation:

1. **Chapter-by-Chapter Phased Rewriting:**
   - Execute one chapter at a time (starting from Ch1).
   - Read the existing `learn:` property of the target chapter.
   - Strip conversational monologue, condense definitions, build clean tables and numbered lists.
   - Preserve all existing past question anchors, IDs, and syllabus sub-topic headings (`x.y.z`).
2. **Quality Checks per Chapter:**
   - Syntax validation: Ensure JS template literal backticks (`` ` ``) are matched.
   - HTML validation: Ensure all tags (`<div>`, `<p>`, `<table>`, `<ul>`, `<ol>`) are perfectly balanced.
   - No content loss: Verify that all topics named in the Purbanchal University syllabus are fully covered with exam-grade depth.
3. **User Review Gate:**
   - Present the transformed chapter sample to the user to confirm the new tone matches expectations before proceeding across all units.

---

## 4a. Progress against this plan

Applied one unit at a time, from Ch1's direction, with the gate (`python tools/run_checks.py`)
and the browser as the acceptance test for each unit. Unit 3 landed 2026-09-17; the record of
what changed and what each guard caught is entry "iteration 7" in `plan.md` §6.

| unit | chapter | state |
| :--- | :--- | :--- |
| 1 | `ch1.js` | **pending** — still the pre-planimp text |
| 2 | `ch2.js` | **done** — definition boxes for the RPC/RMI/objects definitions, the ten-step sequence kept and tightened, worked failure semantics, an RPC-vs-RMI table |
| 3 | `ch3.js` | **done** — the six reasons listed, NTP strata bulleted 0–3, new §3.1.6 Berkeley algorithm, new §3.3.6 comparison of the three mutual-exclusion algorithms, two new Revise blocks |
| 4 | `ch4.js` | **done** — four reasons NFS is stateless (the chapter had no mention of idempotency before), new §4.2.10 on rack-spread placement and re-replication (the word "rack" appeared nowhere), close-to-open as three bullets. The three-component table, the stateful/stateless table, the five-step GFS read path and the MQTT/AMQP table were already in place; the corpus has no numbered **write** path and no per-copy rack rule, so neither was invented (see plan.md iteration 8) |
| 5 | `ch5.js` | **done** — the five NIST essential characteristics added to §5.2.1 (the chapter had them only in the quiz and the Past answer), a new 9-layer provider/customer responsibility table in §5.3 with the pizza analogy beneath it, and two rows (ownership, location) added to the §5.4.3 deployment table. The scalability-versus-elasticity box already existed |
| 6 | `ch6.js` | **done** — the Popek–Goldberg condition added by name in §6.1.6 (control-sensitive and behaviour-sensitive instructions, the privileged-instruction definition, the condition itself, and the seventeen sensitive-but-unprivileged x86 instructions), the container table given **Kernel** and **Startup time** rows, and Type 1 / Type 2 aliases beside the Type I / Type II headings. The hypervisor comparison, two-stage memory translation, nested page tables and the three I/O approaches were already complete. **SR-IOV is in none of the uploaded material**, so the I/O section keeps the three approaches the sources state |
| 7 | `ch7.js` | **done** — the §7.1.2 matrix gained the **Database** row it never had (SimpleDB and RDS with DynamoDB, Azure SQL and Cosmos DB, Bigtable with Cloud SQL and Spanner) and split compute into **Compute (IaaS)** and **Serverless**; §7.2.2 gained the metadata bullet (name, modification time, access control list, up to four kilobytes of user fields, one byte to five terabytes); §7.3.2 gained the EC2 **instance lifecycle** (launch, run, stop, reboot, terminate, image, with the public-versus-elastic IP rule); §7.3.3 gained the **execution path** (trigger, environment, execution, reuse, idle). The object/block/file table and the S3 API and durability facts were already in place. The corpus names **three** pricing models, so **Savings Plans** is a recorded gap (see plan.md iteration 11) |
| 8 | `ch8.js` | **done** — the third data state named (**Data-in-use**, where the row read "Processing of data, including multitenancy"), new **§8.2.3** with the AuthN/AuthZ pair, role-based access control and least privilege (none of the four words was in §8.2), a 3-row **SLA/SLO/SLI** table in §8.3.1, and a 3-row provider/customer table per service model in §8.4.3. The data-life-cycle table and the 99.9%-versus-99.99% arithmetic were already in place. **The three acronyms are in none of the uploaded material**, so they are recorded as a gap (see plan.md iteration 12) |
| 9 | `ch9.js` | **done** — the cloud/fog/edge tiering table (§9.1.2) and the cold-start / execution-cap / statelessness material (§9.2.1–§9.2.2) were already in place, so the pass added only what was missing: Docker's kernel building blocks as a three-item list in §9.3.1 (namespaces, control groups and the layered filesystem) and Kubernetes' component names as a table in §9.3.2 (API server, etcd, scheduler and controller manager on the control plane; kubelet, kube-proxy and the container runtime on the node). **The corpus names none of the seven Kubernetes components and none of the three kernel mechanisms** — the only "cgroup" matches in `_source/dcc/` are inside de-spaced words such as `specificgroup`, and `etcd`, `kubelet`, `kube-proxy` and `controller manager` appear nowhere — so they are given as the standard names for the objects, presented as definitions rather than as the teacher's wording, which is the policy ch9's own header already states. A dangling "9.1.4" in the Fig 9.1 caption (no such section exists) was corrected to 9.1.3. |

Notes that apply to every unit, learned on units 2 through 8:

* **An ask in this plan is a hypothesis about what is missing, so check the chapter first.**
Four of unit 4's six asks were already satisfied by earlier passes — the file-service table, the
stateful/stateless table, the five-step GFS read path and the MQTT/AMQP table — and three of
unit 5's four were (the scalability-versus-elasticity box, the service-model table, most of the
deployment table); a pass that assumed otherwise would have rewritten working teaching. The
reliable way to check is to grep the chapter for the vocabulary the ask uses (`idempotent`,
`rack`, `shared responsibility`, `pizza`, `NIST`): units 4 and 5's real gaps both showed up as
words that appeared nowhere in the chapter — or, for the NIST list, as a word that appeared
fifteen times and never once in the notes.
* **Where the corpus has no answer, record the gap rather than filling it.** Unit 4 asks for a
numbered HDFS write path and for the three-replica rack rule; no deck, book or note in
`_source/dcc/` states either, so the chapter gives the write *model* it does have and the
placement policy as policy, and the chapter's sourcing comment says what the material contains.
An invented write path is the one defect this plan could introduce that no existing tool would
catch.* **The fourth catalogue is a log, and the two-file edit is now one command.**
`data/voice_rewrites.json` holds the catalogue and `data/voice_applied.json` holds the
record of what was applied; `voice_rewrite.py --check` reads the record, so removing a
retired entry from the catalogue alone leaves the gate failing on a rewrite that no
longer exists. `python tools/voice_rewrite.py --retire ch8.js --match "<substring>"
--reason "..."` does both: the entry moves to `_superseded` with its reason, the applied
pass loses it and keeps its fingerprints. It is **transactional** — the gate is run
against the retired state and both files go back if it would go red — which is how a
*chain* (one entry's replacement is the next entry's only anchor) is refused rather than
half-applied. `--match` is read against `find` and `to`, so an entry can be named by the
sentence it produced. Unit 8's pinned-sentence edit, and then unit 9's 78-word sentence,
both needed exactly this.
* **A green gate does not mean the page is right — until the artifact has a step.** Unit 8's
Revise block was written with doubled backslashes, so its line breaks rendered as the visible
text `\r\n` while every check stayed green: the words were correct, the block was under the
cap, and the page and the plan agreed. Walking the built bundle is what caught it. That walk
is still part of the pass, but the specific artifact is now a gate step: `tools/escape_audit.py`
reads the values the browser is given — the nine chapters through node (`tools/dump_dcc.js`)
and the three hand-written catalogues directly — and fails on a literal `\r` or `\n` anywhere
in them, so the same defect cannot reach the page again.
* **A unit's prose is pinned by four catalogues, not one.** `data/voice_rewrites.json` holds
the reviewed voice edits; `data/dcc_revise.json` holds the Revise blocks; `data/dcc_teach.json`
and `data/dcc_rev.json` quote the terms and numbers the unit's own sections must still
contain. Adding is free, restructuring is cheap, and *deleting a sentence* is what costs —
so the pass adds structure around the existing prose and only rewrites a sentence when the
sentence itself is the defect.
* **Every new section needs a Revise block in the same commit**, because
`revise_blocks.py --check` fails on a section with no block. Two new sections cost two new
blocks and one `--apply`. Unit 7 added no sections, so no block was required — but the block
that *answers* a section changes when the section does, and the block is written in
`data/dcc_revise.json`, never in the chapter file: editing the page alone leaves
`the page is not the plan - N block(s) differ` until `--apply` runs. A block is also capped at
90 words and may not contain a numeral the section does not contain ("4 KB" in a block whose
section writes "four kilobytes" is a defect).
* **Off-syllabus material has to be labelled on the page, not only in the tools.** The gate
reports `2.0` and `3.0` as "numbered for a topic the syllabus does not name"
(`syllabus_headings.py`) and the Revise and Teach tabs chip them "start here — outside the
syllabus numbering", but the Learn page itself said nothing, so a reader met "2.0 Distributed
objects" with no hint that it is not a syllabus sub-topic. Both sections now open with a
one-line `prereq-note` marking them as outside the syllabus's sub-topic list. The other seven
sections that teach beyond that list carry the same class, and the wording of all nine is the
same shape — see the label bullet below.
* **The sub-numbers below the syllabus's own are gone, and the prose had to stop citing them.**
The ask was blunt — "uselesss 0.1.1 or 1.1.2 seems useless fix all chapters if u can" — and the
rule that came out of it is narrow: a heading keeps a number only where the syllabus numbers
that sub-topic itself (`1.1`, `8.4`), and everything below keeps only its words. `1.4.4
Fundamental models` is now `Fundamental models`. The cost is a re-key rather than an edit,
because the heading's number was the section's key in `data/dcc_rev.json`,
`data/dcc_revise.json`, `data/dcc_teach.json` and `data/syllabus_map.json`, and `reviseKey` in
`engine.js` falls back to the heading's text as a slug — the same rule in two languages, which
is why the contract test pins it. 171 Revise blocks were re-keyed by slug in one pass, and the
Reference tab's frozen group headings, their `alt` text and the section titles in
`data/off_syllabus_slides.json` lost their numbers with them. The last of those is what
`make_reference.py --check` caught: the tab is rebuilt from the marks data, so stripping the
page and not the data left ch3 and ch4 each rebuilding their tab to text the page no longer
carried.
* **Deleting the numbers is a prose edit too, and only the voice catalogue noticed.**
Ninety-odd sentences
cited a section by its number — "the table in 4.2.2", "the elasticity of 5.2.1", "the purest
form of 5.2.1's pay-per-usage", `Page from the notes for 2.3.7 Persistence and synchronicity` —
and every one of them pointed at a heading that no longer carried it. They were rewritten to
name the thing or to drop the pointer, because the sentence around each one already said what
it was pointing at: a parenthesis and the preposition went with the number, a possessive became
"the", and the twenty-one captions on the Reference tab now read `Page from the notes on
Persistence and synchronicity` (the same sentence updated in `data/caption_changes.json`,
which `fix_captions.py --check` reads). Zero three-part numbers remain in `dcc-site/`, prose or
comment. Four of the rewrites landed inside recorded voice rewrites in two chapters, so
`voice_rewrite.py --check` failed on them until the `to` strings in `data/voice_rewrites.json`
and `data/voice_applied.json` were re-pinned to the new wording — the same edit applied to the
record as to the page. One chain-link entry in ch8 is the exception: its `to` has to keep the
number it was applied with, because the chain's overlap is read from that string and shortening
it breaks the link.
* **A label is prose, and the voice gate reads it as prose.** Seven sections teach something the
syllabus's own list does not name: the fundamental models and the cluster/grid/cloud types
under `1.4`, the Berkeley algorithm under `3.1`, ethics and de-perimeterisation under `5.4`,
NoHype under `6.1`, the service tasks and trends under `6.4`, and XaaS under `7.1`. Each opens
with a `prereq-note` line saying so. The first wording failed `voice_audit.py --check` on four
counts, because it named the deck and the textbook — the same family the gate already refuses
in the notes, on the grounds that those sentences describe where the material came from instead
of stating what it is. The replacement states the fact about the syllabus itself ("1.4 names
three models: client-server, peer-to-peer and multitier"), and `.prereq-note` now has a rule in
`foundation.css`: until this pass it was a class with no styling, so the two foundation notes
rendered as the first paragraph of their section.
* **The Learn prose had a little editorial filler left that the twelve tells do not reach.**
Eight phrases were trimmed: ch3's "the most important practical issue … and also the most
problematic" (rewritten to state the fact — no reliable global time), "Crucially", ch4's two
"it is worth" clauses, ch6's "it is worth seeing why they are separate jobs at all", "The
interesting instructions" (now "the sensitive instructions", which is the Popek–Goldberg term),
"In fact the hypervisor is controlling", and ch9's "Note that" — plus a ch9 sentence fragment
left by an earlier split. Two of them sat inside recorded voice rewrites, which is exactly what
`--retire` now exists for: both entries were retired to `_superseded` and the gate stayed green.
* **The length pass costs catalogue edits, not just prose.** Fifteen prose sentences over 45
words reappeared as units 4–8 were rewritten, and splitting them was not only a prose edit:
ch2 §2.3.7 is a whole-sentence voice rewrite, so it had to be retired first; the figure
keeper that patched ch2's sentence (`tools/dcc_figure_keepers.json`) had to be re-pointed at
the split text or `slim_dcc_figures.py --check` failed; and ch3 §3.1's first split was
re-written because the Revise-card guard (`rev_summaries.py`) caught it dropping the pinned
term *logical clocks*. After the batch, the count over 45 words is **0** (longest 45) and all
31 gate steps pass. The record is batch 3 in `data/sentence_splits.json`.
* **Structure with single-word list labels and the emphasis gate stays quiet.** The gate's
budget is three bold runs per section and its shape rule rejects a run with a co-ordinating
conjunction, so `**Launch**`, `**Trigger**`, `**Idle**` pass as list labels while
"Stop and start" or "Ownership and operation" do not. Units 5 and 6 each spent a repair
learning that; unit 7 was written that way from the start and needed no emphasis fix at all.
* **"Zero three-part numbers remain" was true of the headings and not of the prose.** The
claim two bullets above was checked with `<h[234]>x.y.z`, which is where the strip happened,
and fifteen citations were sitting in body text, captions and quiz explanations the whole time
— "the failure model of 1.4.4", "the isolation rule of 6.1.3", "the properties from 5.2.1",
"the container definition in 6.2.2", "It is the same idea as DBaaS in Unit 7.2.3". **A
reference is not in the place you deleted it from.** All fifteen were repaired under the same
policy as before — name the section or drop the pointer — and the check that finds them is now
its own gate step, `tools/stale_refs.py`: it walks every value the browser is given (the nine
chapters through node, the three applied catalogues, and the two data files the build renders
directly) and fails on a three-part number anywhere in one, headings and prose alike. It skips
keys beginning with `_`, which is how these files carry their `_comment` blocks — a comment
explaining the old numbering has to be able to name it. Two things are deliberately not
defects: a two-part number, because that is how the syllabus itself numbers a sub-topic, and a
version such as HDFS's `0.23` series. A second defect fell out of the same sweep: the 8.4 chain
said "the four data states' exposures" where the section it points at says *three*.
The journals that carry three-part numbers by design — `syllabus_map.json`,
`caption_changes.json`, `emphasis_decisions.json`, `voice_curate_*.json` — are read by their own
tools and never rendered, so they are outside the boundary; rewriting a journal to hide what it
recorded would make it useless. `caption_changes.json` is the one that still holds the
pre-strip caption text, which is why `fix_captions.py --check` reports a moved file rather than
agreeing — that check is not in the gate, and its `--restore` refuses on a moved file by design.
* **The reader-visible Learn prose got a second filler pass, and the tells list is not enough.**
About thirty sentences were rewritten this time, all of them inside the Learn and caption text
rather than the Revise, Quiz or Past tabs, where exam framing belongs. The shapes that
recurred: a sentence that narrates its own artifact ("The trade-off behind the table", "The
note beneath the diagram", "The point of drawing them vertically", "That one diagram holds the
whole architecture"), a sentence that addresses the writer's process ("The example is
deliberately mundane", "The full name is the pattern", "the closing argument of the section",
"the last thing to carry away"), and a hedging tail on a factual sentence ("— which is
precisely the argument for doing better", "and they are the reason the subject is here at
all"). None of them is a *tell* in the catalogue's sense, so `voice_audit.py` never saw them:
what finds them is a hand read of a per-sentence keyword sweep, and what proves them is the
same `voice_rewrite.py --check` — nine of the rewrites landed inside pinned entries, and a
pinned entry is not repaired by editing the page: `--check` reads the applied record, so the
`to` string had to be re-pinned in `data/voice_applied.json` (and in `data/voice_rewrites.json`
where the entry is catalogue-based) in the same edit. `--retire` covers the chained case only
when the whole chapter's check can go green without the entry, which for a chain it cannot, and
the tool says so rather than half-applying it: `retire it in plan.md's sense — edit the text,
then the catalogue`.
* **The site preview serves `dist-dcc`, not `dcc-site`.** Two `http.server` processes were
already listening on the same port with `--directory dist-dcc`, so the Preview tab showed the
last build, not the working tree: a stripped heading still read `7.1.1` and a trimmed sentence
still read "The pattern to notice" after the page had been changed. The bundle is rebuilt with
`python tools/build_deploy.py --entry dcc-site/index.html --out dist-dcc --sheet --zip
--zip-name dcc-study-portal.zip` (**`--sheet` is not optional** — `make_theme_sheet.py --check`
fails on a bundle built without it), the service worker and its cache are unregistered before
the reload, and only then does the browser agree with the gate.

### 4a.xiii. Read-through of all nine chapters, by hand (2026-09-17)

* **The pass the reader asked for was a read, not a sweep.** Every chapter was read end to end
  in the rendered order (`learn` field, in reading order), which is the only way to see the class
  of sentence that keeps surviving: the ones that are grammatical, factual and useless. Twenty-
  two went, and each was a judgement call read in its paragraph rather than a pattern match.
* **The shapes, with the worst instance of each.** Sentences about the page ("The diagrams carry
  five ideas", "That last sentence is the hook into the consistency problem", "Each of the next
  three sub-sections", "What makes a VM a machine rather than a process is the sentence above",
  "Read it as one question"); sentences rating the material ("the derivation is the most
  mathematical thing in the unit", "Worked examples matter more here than anywhere else in the
  course"); exam coaching sitting in Learn ("The one step to explain rather than state", "The idea
  to state in one sentence", "Half 1 (4 marks)", "Both this list's contain five phases"); and
  reader instruction ("Draw the difference as a layer rather than describing it").
* **Two of the edits were repairs, not trims.** "Both this list's contain five phases" was not
  grammatical, and the duplicated claim about the four deployment models ("four settings of the
  same trade") appeared twice in one paragraph. The ch5 activities lead-in also read "involves :"
  with a space before the colon once its dash aside was removed.
* **Four chapters' worth of pinned entries had to be re-pinned, and one chain could not be.** The
  substitution list that edited the page was applied to every `to` in the catalogue and the
  applied log, which covers an entry that pinned a trimmed sentence inside a longer paragraph.
  It does not cover a chain: ch3's "Worked examples matter more here…" is one entry's replacement
  and the next entry's `find`, so deleting the surviving sentence breaks three entries at once and
  the fix is to set all three to deletions (which `--check` reads as "verified by its `find` being
  gone"). `data/sentence_splits.json` and `tools/dcc_figure_keepers.json` needed the same
  treatment as before: ch2's two keepers pin the paragraphs that replaced the old "figures below"
  sentences, so their `new` text follows the page.
* **The preview needed the cache cleared, not the bundle rebuilt.** The served `site.js` already
  held the new text (verified with `fetch('site.js', {cache: 'no-store'})`) while the page still
  rendered the old one: the service worker was still controlling the tab. Unregistering it,
  deleting `offline-*` and reloading with a query string brought the page and the gate into
  agreement, and `run_checks.py --all` reads 40 passed (2 known gaps excluded).

### 4a.xiv. Unit 9's two missing diagrams, and three drawings that were wrong (2026-09-17)

**The two diagrams the unit asked for, in the style of the two it had.** Unit 9's notes held two
figures &mdash; edge/fog/cloud as one system, and the cloud-native stack &mdash; and the two topics
that most repay a picture had none: Docker's three kernel mechanisms and Kubernetes' component
split. They are now **Fig 9.2** (image and container above namespaces, control groups and a
layered filesystem above one shared host kernel) and **Fig 9.3** (control plane of API server,
etcd, scheduler and controller manager facing node of kubelet, kube-proxy, container runtime and
pods, with the two arrows between them). The cloud-native stack figure moved to **Fig 9.4** so the
numbers stay in reading order, and each new figure carries an `aria-label`, a caption that states
the point rather than the parts, and its own marker id.

**Then the part the request exposed.** "With the gate green" is not the same as "drawn right", and
three labels were already outside their frames while every word, caption and syllabus line passed:

* **Fig 6.2** put its two footnote lines at `x="150"` with `text-anchor="middle"` in a 760-wide
  viewBox, so 89- and 85-character strings began at x = -95 and -60: the first half of both
  sentences was cut off, and the second line's descenders ran past the 260-tall edge as well. Both
  now sit at x = 380 below the hardware box, and the viewBox grew to 300 to hold them.
* **Fig 9.1**'s cloud box had a fourth line ending past the right edge, so "…archives, heavy
  analytics" was cut mid-word. It is now two lines inside the box.
* **Fig 4.2** was not geometry but markup, and the worst of the three: the label "The NameNode
  knows *where* every block is…" used `<em>`, and `<em>` is one of the tags the HTML parser treats
  as a break out of foreign content. The parser left the SVG there, **14 of the figure's 15 labels
  were drawn**, and the last two sentences rendered as loose text under the diagram (measured on
  the page: stray `EM` and `TEXT` children of the `<figure>`, one of them 42px of body text).
  Emphasis inside a drawing is `<tspan class="flow-em">`, and the class is now in the SVG alphabet.

**`tools/dcc_figures.py` is the gate step that would have caught all three.** `check_figures.js`
re-derives this contract for the Simulation portal and reads *that* portal's chapters
(`require('../ch' + n + '.js')`, root, one to eight), so the DCC site's twenty-two hand-drawn
figures had never been through any check. The new step reads the same values `escape_audit.py` and
`stale_refs.py` read (`tools/dump_dcc.js --fields`), applies check_figures' rules to them, and adds
three of its own: the SVG is **parsed as XML** (a stray `<` or an unclosed tag, which the
JavaScript checker's regular expressions cannot see), a figure is named by its **caption number**
rather than its index, and an **HTML-breakout tag inside the `<svg>`** fails - the Fig 4.2 defect
itself. Both defects were re-injected to confirm the step fails on them and passes when fixed.

**The width estimate was wrong in a way worth writing down.** Measuring the pages gave 412.6 units
for the label `check_figures.js`'s table called 372, and the 10% is `.flow-label`'s
`letter-spacing: 0.04em` - 0.46px per character, which no estimate had counted. The new checker
adds the class's tracking and reads each class's own anchor from the CSS instead of assuming
`middle` everywhere (only `.flow-text` declares it; a `.flow-label` without the attribute anchors
at `start`). Its estimate now lands within about 1% of the browser on the strings it measures.**Then the fit inside the frames, which the gate could not have known about either.** Measuring
each label against the box it sits in named four more lines wider than the frame they were drawn
in: **Fig 9.1**'s fog line (280 units in a 220-wide box) is now two lines, and **Fig 9.4**'s three
boxed lines - the orchestrator's 524 in a 440, "…each owning its data, talking over APIs" at 484,
"…the same artefact everywhere" at 471 - were trimmed to fit theirs (335, 367 and 376). Text that
crosses a box's own border is readable, so this is polish rather than breakage, and it is only in
Unit 9 that it was cleaned up; the two remaining straddles on the site are Fig 2.1's and Fig 4.3's
(204 and 219 units against 220- and 170-wide boxes, 2px and 49px of overshoot).

**Verified in a browser, not only by the checker.** Loading every chapter's `learn` into an
 off-screen container and calling `getBBox()` on each label: **22 figures, 334 labels, 0 outside
their viewBox, 0 stray elements inside a figure** - which is the same count the Python step
reports. `run_checks.py --all` reads **42 passed** (2 known gaps excluded), 44 steps, with
"the notes' drawings keep their text inside the frame" as step 10.

* **Not a defect, and easy to mistake for one from a screenshot:** a wide figure renders at its
designed size and the wrapper scrolls sideways when the column is narrower (`--fig-min` is set from
the figure's own viewBox by `enhanceContent()`, section 15 of the stylesheet). On a 676px column
Fig 9.3 therefore paints 800px wide with a horizontal scrollbar, as all nineteen wide figures do -
the drawing is not being cut off, it is being kept at a legible scale.

* **Still open, and the same blind spot:** `check_figures.js` keeps its flat estimate, so the
  Simulation portal's own figures could be hiding an overflow of the same kind. Fixing it there
  means re-measuring those figures against a stricter estimate, which is a pass of its own.

## 5. Summary of Deliverables

* **Output File:** `dcc-site/ch[1-9].js` updated with punchy, high-yield student notes.
* **Tone Achieved:** Clean, academic yet accessible, point-wise, diagram-rich, exam-ready.
* **Result:** The DCC study portal matches the clarity, polish, and readability of the Simulation portal.
