/* Chapter 4 — Distributed File Systems and Middleware.

   Syllabus unit 4: 5 hours, 6 marks. Sub-topics 4.1 DFS concepts
   (Transparency, Naming, Replication, Consistency), 4.2 NFS, HDFS,
   4.3 Middleware: CORBA, Java RMI, Messaging MQTT, AMQP.

   Written from the course's own material, read into `_source/dcc/` by
   tools/dcc_extract.py:

     lecture_notes_all_chapterwise_chapter4_lecture_notes_all.txt
         Er. Avijit Karn's 41-slide Chapter 4 deck — DFS concepts and the file
         service architecture, SUN NFS, the DFS comparison table, heterogeneity,
         middleware and CORBA

     hdfs_note_4std_lecture.txt, gfs_hdfs_lecture.txt
         the HDFS note (design, blocks, namenodes and datanodes, NameNode
         failure, federation, high availability, failover and fencing) and the
         GFS/HDFS lecture (GFS assumptions, architecture, the read operation,
         master metadata, chunks)

     lecture_notes_all_chapterwise_ch4_messagingprotocol_mqtt_amqp_for_students.txt
         the MQTT/AMQP deck

   Where a fact comes from the recommended textbook rather than the class
   material it says so — notably the NFS consistency window, which the deck does
   not give a number for and Coulouris does.

   The four replication-placement rules added under where the three replicas go are read from the GFS/HDFS
   deck's chunk-replica-placement slide (page 25 of its OCR): spread the copies
   across racks, prefer under-utilised chunkservers, limit the number of recent
   creations on each chunkserver, and re-replicate from an existing valid replica
   when the available copies fall below the setting, with the clone operations and
   their bandwidth bounded. Nothing in the material goes further than that — it
   does not say which rack a given copy is placed in — so the notes state the
   policy and not a rule that was never given. */

window.CHAPTERS = window.CHAPTERS || {};
window.CHAPTERS[4] = {
  learn: `

<h2>Unit 4 &mdash; Distributed File Systems and Middleware</h2>
<p class="unit-meta">Syllabus: 5 hours &middot; 6 marks &middot; sub-topics 4.1&ndash;4.3</p>

<h2>4.1 DFS concepts: Transparency, Naming, Replication, Consistency</h2>

<h3>What a DFS is</h3>
<p>A Distributed File System (DFS) is a classical model of a file system distributed across multiple machines, whose purpose is to promote the sharing of dispersed files. The distinction is exact: the resources on a particular machine are local to itself; resources on other machines are remote. A file system provides a service to clients, and the server interface is the normal set of file operations &mdash; create, read, and so on.</p>

<p>The defining property of a DFS: it enables programs to store and access remote files exactly as they do local ones, allowing users to access files from any computer on the network. Recent advances in the bandwidth of switched local networks and in disk organisation have produced high-performance, highly scalable file systems.</p>

<p>Configuration and implementation may vary, and three variations are named. Servers may run on dedicated machines, or servers and clients can be on the same machines. The operating system itself can be distributed, with the file system a part of that distribution. A distribution layer can be interposed between a conventional OS and the file system. In every case the requirement is the same: clients should view a DFS the same way they would a centralized file system &mdash; the distribution is hidden at a lower level. And the performance criterion is two numbers, not one: throughput and response time.</p>

<h3>The design goals</h3>
<p>Eight DFS concepts, requirements and design goals:</p>

<table class="comparison-table">
<thead>
<tr><th>Goal</th><th>What it means in a DFS</th></tr>
</thead>
<tbody>
<tr><td><strong>Transparency</strong></td><td>The distribution is invisible: remote files are used exactly as local ones.</td></tr>
<tr><td><strong>Concurrency</strong></td><td>Many clients access and update files at the same time, and the system keeps them consistent.</td></tr>
<tr><td><strong>Replication</strong></td><td>Multiple copies of a file exist, for availability and performance.</td></tr>
<tr><td><strong>Heterogeneity</strong></td><td>Different hardware, operating systems and networks must interoperate &mdash; the property that 4.3's middleware exists to provide.</td></tr>
<tr><td><strong>Fault tolerance</strong></td><td>The service keeps working when machines, disks or networks fail.</td></tr>
<tr><td><strong>Consistency</strong></td><td>All readers see updates according to a defined rule, despite caching and replication.</td></tr>
<tr><td><strong>Security</strong></td><td>Access control and authentication apply to remote files as strictly as to local ones.</td></tr>
<tr><td><strong>Efficiency</strong></td><td>Throughput and response time close to a local file system's.</td></tr>
</tbody>
</table>

<h3>Transparency</h3>
<p>Transparency in a DFS is the family of properties applied to files. The strict form is <strong>access transparency</strong> &mdash; a client program issues the same operations on a remote file as on a local one and gets the same result. A full answer names the others too: <strong>location</strong> (the client does not know where the file is), <strong>migration</strong> and relocation (the file may move, even while in use), replication (the client does not know how many copies exist). The rest are concurrency (others are using it), failure (a copy failed and was recovered), and persistence (memory or disk).</p>
<p>The design ambition is that in a transparent DFS the location of a file, somewhere in the network, is hidden &mdash; which is exactly what the naming schemes either deliver or fail to deliver. This is why NFS is described as having access transparency as its design goal while most other systems in its comparison table have something else.</p>

<h3>Naming &mdash; three schemes, and the mapping underneath</h3>
<p>Naming is the mapping between logical and physical objects. Example: a user's filename maps to a physical location such as <code>&lt;cylinder, sector&gt;</code>. In a conventional file system that is understood as <em>where the file actually resides</em>, because the system and the disk are known. In a transparent DFS, the location of a file somewhere in the network is hidden, and if the file is replicated, the mapping returns a set of locations for the replicas rather than one.</p>

<p>There are three main approaches to naming files, and the trade-off between them is location transparency:</p>

<table class="comparison-table">
<thead>
<tr><th>#</th><th>Scheme</th><th>Transparency</th><th>Example</th></tr>
</thead>
<tbody>
<tr><td>1</td><td>Files are named with a combination of host and local name.</td><td>Guarantees a unique name, but is neither location transparent nor location independent. The same naming works on local and remote files, and the DFS is a loose collection of independent file systems.</td><td>A path naming the host explicitly.</td></tr>
<tr><td>2</td><td>Remote directories are mounted to local directories. The local system then appears to have a coherent directory structure.</td><td>The files are <strong>location independent</strong> &mdash; but remote directories must be explicitly mounted.</td><td>SUN NFS is the good example of this technique.</td></tr>
<tr><td>3</td><td>A single global name structure spans all the files in the system, and the DFS is built the same way as a local file system.</td><td>Location independent, with the strongest illusion of one system.</td><td>A single global namespace.</td></tr>
</tbody>
</table>

<p>Implementation technique: the choice is between a <strong>non-transparent mapping</strong> (<code>name &rarr; &lt;system, disk, cylinder, sector&gt;</code>) and a <strong>transparent mapping</strong> (<code>name &rarr; file_identifier &rarr; &lt;system, disk, cylinder, sector&gt;</code>). The extra level is what buys transparency: when changing the physical location of a file, only the file identifier needs to be modified, so this identifier <strong>must be unique</strong>. </p>

<p>Mounting. <em>Mount</em> is the availability of files for users, made possible by the OS and storage services; <em>mounting</em> a file system attaches that file system to a directory (the mount point) and makes it available to the system. The root (/) file system is always mounted, and any other file system can be connected to or disconnected from it.</p>

<h3>The file service architecture</h3>
<p>An architecture that offers a clear separation of the main concerns in providing file access is obtained by structuring the file service into <strong>three components</strong>:</p>
<figure class="figure-wide figure-wrap">
<svg class="figure wide" viewBox="0 0 760 320" role="img" aria-label="File service architecture: application programs use a client module that wraps the flat file service and directory service; the directory service maps text names to UFIDs, and the flat file service performs operations on file contents addressed by UFID">
<defs><marker id="f4a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="flow-arrow-head"/></marker></defs>

<text class="flow-label" x="200" y="22" text-anchor="middle">Client computer</text>
<rect class="flow-box phase1" x="40" y="36" width="150" height="40" rx="8"/>
<text class="flow-text" x="115" y="61">Application program</text>
<rect class="flow-box phase1" x="220" y="36" width="150" height="40" rx="8"/>
<text class="flow-text" x="295" y="61">Application program</text>
<rect class="flow-box phase2" x="40" y="96" width="330" height="46" rx="9"/>
<text class="flow-text" x="205" y="124">Client module &mdash; one API for both services</text>
<text class="flow-label" x="205" y="160" text-anchor="middle">caches recently used file blocks &middot; knows server locations</text>

<text class="flow-label" x="600" y="22" text-anchor="middle">Server computer</text>
<rect class="flow-box phase3" x="480" y="36" width="240" height="46" rx="9"/>
<text class="flow-text" x="600" y="64">Directory service</text>
<text class="flow-label" x="600" y="100" text-anchor="middle">text name &harr; UFID</text>
<rect class="flow-box phase4" x="480" y="120" width="240" height="46" rx="9"/>
<text class="flow-text" x="600" y="148">Flat file service</text>
<text class="flow-label" x="600" y="184" text-anchor="middle">create, read, write, delete by UFID</text>

<path class="flow-arrow" d="M115,76 V92" marker-end="url(#f4a)"/>
<path class="flow-arrow" d="M295,76 V92" marker-end="url(#f4a)"/>
<path class="flow-arrow" d="M374,110 H476" marker-end="url(#f4a)"/>
<text class="flow-label" x="425" y="102" text-anchor="middle">lookup</text>
<path class="flow-arrow" d="M374,140 H476" marker-end="url(#f4a)"/>
<text class="flow-label" x="425" y="132" text-anchor="middle">operations</text>

<text class="flow-label" x="380" y="228" text-anchor="middle">A file has one UFID; its text name is only ever a directory-service mapping.</text>
<text class="flow-label" x="380" y="252" text-anchor="middle">UFIDs are long sequences of bits, chosen so that every file in the distributed system is unique.</text>
<text class="flow-label" x="380" y="276" text-anchor="middle">That is why a file can be renamed or moved without touching its contents.</text>
</svg>
<figcaption>Fig 4.1 &mdash; The three components of the file service architecture. The client module implements the exported interfaces of the flat file and directory services on the server side, so an application sees one API: on UNIX hosts it emulates the full set of Unix file operations.</figcaption>
</figure>
<table class="comparison-table">
<thead>
<tr><th>Component</th><th>Responsibility</th></tr>
</thead>
<tbody>
<tr><td><strong>Flat file service</strong></td><td>Concerned with operations on the contents of files. Unique File Identifiers (UFIDs) are used to refer to files in all requests to it. UFIDs are long sequences of bits chosen so that each file is unique among all files in a distributed system.</td></tr>
<tr><td><strong>Directory service</strong></td><td>Provides the mapping between the text names of files and their UFIDs. Clients obtain a UFID by quoting its text name to the directory service. It also supports the functions needed to generate directories and add new files to directories.</td></tr>
<tr><td><strong>Client module</strong></td><td>Runs on each computer and provides the integrated flat-file and directory service as a single API to application programs &mdash; on UNIX hosts it emulates the full set of Unix file operations. It holds information about the network locations of the flat-file and directory server processes, and achieves better performance through a cache of recently used file blocks at the client.</td></tr>
</tbody>
</table>

<p>Every DFS caches at the client, and every consistency mechanism exists to bound how stale that cache may be.</p>

<h3>Consistency in a DFS</h3>

<div class="concept-box key">
<h4>The definition</h4>
<p>Consistency is the requirement that when a file is replicated or cached, all clients that read a file observe the effects of updates according to a defined rule. It exists as a problem because a DFS keeps <strong>more than one copy</strong> of data &mdash; replicas on servers for availability, and cached blocks on clients for performance &mdash; so a write to one copy does not automatically reach the others. Consistency is the contract that says <em>how soon, and in what order</em>, it does.</p>
</div>

<p>Three facts make this unavoidable rather than optional:</p>
<ol>
<li>Caching is mandatory for performance. The client module caches recently used file blocks; the DFS comparison table records a <em>cache consistency</em> strategy for every system in it &mdash; NFS, Coda, Plan 9 and xFS all choose <strong>write-back</strong>, SFS writes through. Write-back is faster and leaves a window in which the cache is wrong.</li>
<li>Replication is mandatory for availability. The mapping for a replicated file returns a <em>set</em> of locations, so an update must either reach all replicas or be ordered so that readers can tell which copy is current.</li>
<li><strong>Concurrent access is normal.</strong> Concurrency is one of the eight design goals: several clients read and write the same file, so the rule must say what happens when they disagree.</li>
</ol>

<p>The two ends of the spectrum are these, and each of the systems sits at one of them:</p>

<table class="comparison-table">
<thead>
<tr><th></th><th>Strict consistency</th><th>Relaxed / weaker consistency</th></tr>
</thead>
<tbody>
<tr><td><strong>Guarantee</strong></td><td>Every read sees the most recent write, immediately, everywhere.</td><td>Reads may see an older version for a bounded, defined period or until a defined event.</td></tr>
<tr><td><strong>What it requires</strong></td><td>Writes propagated synchronously to every copy before the write completes, and no client cache trusted.</td><td>Caching and replication with an explicit rule for when staleness ends.</td></tr>
<tr><td><strong>Cost</strong></td><td>Latency on every write proportional to the number of copies; poor throughput.</td><td>A consistency window in which different clients see different data.</td></tr>
<tr><td>Where it appears in this syllabus</td><td>Read-one/write-all replication, where a write must reach every copy before it is acknowledged (ROWA, Coda's replication strategy).</td><td><strong>NFS</strong> (close-to-open, with a 30-second consistency window), GFS and HDFS (write-once, append-only, relaxed while a file is being written).</td></tr>
</tbody>
</table>

<div class="concept-box warn">
<h4>NFS: close-to-open consistency, and the 30-second window</h4>
<p>NFS chooses relaxed consistency, and three statements define exactly what it chose:</p>
<ul>
<li><strong>Close-to-open</strong> &mdash; writes an application makes may sit in the client's cache and are invisible to other processes until the file is closed, so a client batches its writes and flushes them on close.</li>
<li><strong>Readers can disagree</strong> &mdash; a file open on two clients can show two different contents until one of them closes it, and that is the accepted consequence rather than a bug.</li>
<li><strong>A 30-second window</strong> &mdash; most NFS installations operate with a consistency window of 30 seconds between client and server, which is how long a client may keep using cached data before revalidating it. <span class="muted">Coulouris, Section 12.3</span></li>
</ul>
</div>

<p>Two further points follow. First, consistency interacts with the failure model: NFS is stateless, so a client that crashes loses nothing and a server that crashes needs no recovery state. A stateless server, however, cannot remember that a client holds a file, which is why NFS has <strong>no file locking</strong> and why its UNIX semantics are not perfectly preserved (4.2). Second, a cache consistency protocol is what makes caching safe: write-back with revalidation, or write-through at the cost of performance.</p>

<h3>Replication</h3>
<p>File replication means multiple copies of a file, and in a transparent DFS the naming mapping returns a set of locations for the replicas. Replication buys two different things:</p>
<ul>
<li>Availability and fault tolerance &mdash; if one server or disk fails, another copy answers. This is the purpose in HDFS, where every block is replicated to <strong>typically three</strong> physically separate machines.</li>
<li><strong>Performance</strong> &mdash; a read can be served by the nearest or least-loaded replica, which is what the read-one/write-all scheme trades against write cost.</li>
</ul>
<p>The comparison table records how each system handles it: NFS <strong>minimal</strong> replication with a <strong>client-based</strong> recovery and reliance on <em>reliable communication</em> for fault tolerance; Coda with ROWA (read one, write all) plus replication and caching, and a <em>reintegration</em> recovery; Plan 9 with none. xFS uses striping &mdash; a different use of multiple copies, spreading one file across servers for bandwidth rather than duplicating it; and SFS has none, with <em>self-certifying</em> secure channels. Across those systems replication is a design choice with three different motivations &mdash; availability, read performance, and bandwidth &mdash; and consistency is the price of the first.</p>

<h2>4.2 NFS, HDFS</h2>

<h3>SUN NFS &mdash; what it is</h3>
<div class="example-box">
<h4>Example: SUN NFS</h4>
<ul>
<li>Developed by Sun Microsystems in 1985, and the first commercially successful network file system.</li>
<li>Developed for their <strong>diskless workstations</strong>, and designed for robustness and adequate performance &mdash; not for the best possible performance: Sun published all protocol specifications, which is why NFS became a standard rather than a product.</li>
<li>It runs on Sun OS, and it is both an implementation and a specification of how to access remote files &mdash; both a definition and a specific instance. The goal is to share a file system transparently.</li>
<li>It uses the client&ndash;server model, but a node can be both simultaneously and can act between any two nodes, so there is no dedicated server.</li>
</ul>
<p>NFS is <em>both an implementation and a specification</em>: because Sun published the protocol rather than keeping it, other vendors could implement the same interface, which is how a product became the standard. It is also why the file service architecture can name NFS as its example without referring to any particular machine. An NFS server is an ordinary machine exporting a directory, which makes the model symmetric in practice even though the protocol is not: no machine is dedicated to the role. The stated priority is robustness and adequate performance rather than the best possible performance, and the stateful-versus-stateless comparison shows what that choice costs: a stateless service, and the recovery behaviour that follows from having no state to lose.</p>
</div>
<h3>Stateful versus stateless services</h3>
<p>NFS's single most consequential design decision is that it is <strong>stateless</strong>. The comparison:</p>

<table class="comparison-table">
<thead>
<tr><th></th><th>Stateful service</th><th>Stateless service</th></tr>
</thead>
<tbody>
<tr><td><strong>Definition</strong></td><td>The server keeps track of information about client requests: which files are open by a client, connection identifiers, server caches.</td><td>Each client request provides the complete information the server needs &mdash; filename, file offset, and so on. The server <em>may</em> keep information on behalf of the client, but it is not required to.</td></tr>
<tr><td><strong>Bookkeeping</strong></td><td>Memory must be reclaimed when a client closes a file or dies.</td><td>Nothing to reclaim; there is no per-client state to lose.</td></tr>
<tr><td><strong>Performance</strong></td><td><strong>Better</strong> &mdash; the filename does not have to be parsed on every request, and files do not have to be opened and closed again for each one.</td><td>Worse: every request repeats the lookup, which is why a stateless design has to be compensated with client caching.</td></tr>
<tr><td><strong>Fault tolerance</strong></td><td>A stateful server loses everything when it crashes. Recovery requires the client and server to resynchronise their state.</td><td>A stateless server remembers nothing, so it can start easily after a crash &mdash; the client simply retries.</td></tr>
</tbody>
</table>

<h3>NFS's design, and its three parts</h3>
<p>NFS's characteristics: <strong>NFS is stateless</strong>, and all client requests must be self-contained. Machine and OS independence means it could be implemented on the low-end machines of the mid-1980s. <strong>Fast crash recovery</strong> is the major reason behind the stateless design; <strong>transparent access</strong> means remote files are accessed exactly as local ones; with UNIX semantics maintained on the client.</p>

<p>Four consequences are what the stateless choice buys:</p>
<ol>
<li><strong>Fast crash recovery</strong> &mdash; a stateless server needs no recovery action at all: it starts running again and waits for requests, because there was no state to restore.</li>
<li><strong>Nothing to reclaim</strong> &mdash; with no per-client state there is no table to maintain and no memory to free when a client closes a file or dies. A stateful server has to notice both events.</li>
<li><strong>Retryable requests</strong> &mdash; each request carries the filename and the byte offset it needs, so a lost one is answered by sending it again. The operations are repeatable too: a read, or a write that names the offset it writes to, gives the same result however many times it runs. An operation that adds to whatever is already there &mdash; an append, a counter that must increase &mdash; is not repeatable, which is why the offset is stated instead. This is the same requirement that call semantics meet with idempotent operations.</li>
<li><strong>No per-client state</strong> &mdash; the server holds no entry per client, so its memory is sized by the filesystem it exports rather than by how many machines are talking to it.</li>
</ol>
<p>The basic design has three important parts &mdash; the protocol, the server side and the client side:</p>

<table class="comparison-table">
<thead>
<tr><th>Part</th><th>Detail</th></tr>
</thead>
<tbody>
<tr><td><strong>The protocol</strong></td><td>Uses the <strong>Sun RPC mechanism</strong> and the Sun eXternal Data Representation (XDR) standard. It is defined as a set of remote procedures. The protocol is stateless: each procedure call contains all the information necessary to complete the call.</td></tr>
<tr><td><strong>Server side</strong></td><td>The <strong>file handle</strong> consists of three things: a filesystem id identifying the disk partition, an i-node number identifying the file within the partition, and a generation number changed every time the i-node is reused to store a new file. The server stores the filesystem id in the file system superblock and the i-node generation number in the i-node. This is a naming scheme with exactly the shape the naming schemes described: the handle is the file identifier that makes the mapping transparent.</td></tr>
<tr><td><strong>Client side</strong></td><td>Provides a <strong>transparent interface</strong> to NFS. The mapping between remote file names and remote file addresses is done at server boot time through remote mount &mdash; an extension of UNIX mounts, specified in a mount table, which makes a remote subtree appear part of a local subtree. A new virtual file system interface supports VFS calls, which operate on a whole file system, and VNODE calls, which operate on individual files, so all files are treated in the same fashion.</td></tr>
</tbody>
</table>
<p>Access control and authentication. Because the NFS server is stateless, the user's identity and access rights must be checked by the server on every request &mdash; in a local file system they are checked once, against the file's access permission attribute. Every client request is accompanied by the userID and groupID, inserted by the RPC system, and Kerberos has been integrated with NFS to provide a stronger and more comprehensive security solution.</p>

<p>Issues with NFS:</p>
<ul>
<li>NFS root file systems cannot be shared ("too many problems").</li>
<li>Clients can mount any remote subtree any way they want, so the same subtree can have different names on different clients by being mounted in different places. NFS uses a set of basic mounted file systems on each machine and lets users do the rest.</li>
<li>NFS passes user id, group id and groups on each call, which requires the same mapping from user id and group id to user on all machines &mdash; a real constraint across administrative domains.</li>
<li>NFS has no file locking.</li>
<li>In general NFS tries to preserve UNIX open file semantics but does not always succeed: if an opened file is removed by a process on another client, the file is immediately deleted.</li>
</ul>

<h3>HDFS &mdash; design and why it is shaped that way</h3>
<div class="example-box">
<h4>Example: HDFS</h4>
<p>When a dataset outgrows the storage capacity of a single physical machine, it becomes necessary to partition it across a number of separate machines. File systems that manage storage across a network of machines are called distributed file systems. Hadoop ships with one: HDFS, the Hadoop Distributed File System.</p>
<p>HDFS is a file system designed for storing very large files with streaming data access patterns, running on clusters of commodity hardware. All three parts of that sentence matter:</p>
<ul>
<li><strong>Very large files</strong> &mdash; hundreds of megabytes, gigabytes or terabytes in size, with Hadoop clusters today holding petabytes.</li>
<li><strong>Streaming data access</strong> &mdash; HDFS is built around the idea that the most efficient data processing pattern is write-once, read-many-times: a dataset is generated or copied once, then analysed many times.</li>
<li><strong>Commodity hardware</strong> &mdash; Hadoop does not require expensive, highly reliable hardware; it is designed to run on commonly available hardware from multiple vendors, for which the chance of node failure across the cluster is high, at least for large clusters. HDFS is designed to carry on working without a noticeable interruption to the user in the face of such failure.</li>
</ul>
<p>And, exactly as with GFS, HDFS is not a good fit for: <strong>low-latency data access</strong> (applications needing responses in the tens of milliseconds will not work well). <strong>Lots of small files</strong> are another problem, because the namenode holds filesystem metadata in memory: the number of files is governed by the namenode's memory. Nor does it suit multiple writers or arbitrary file modifications: files may be written by a single writer, writes always at the end of the file, and modifications at arbitrary offsets are not supported.</p>
</div>

<h3>Blocks</h3>
<p>HDFS has the concept of a <strong>block</strong>, but a much larger unit &mdash; <strong>64 MB by default</strong> (many installations use 128 MB). Files are broken into block-sized chunks, which are stored as independent units. Three benefits are given for the abstraction:</p>
<ol>
<li>A file can be larger than any single disk in the network. Nothing requires the blocks of a file to be on the same disk, so they can use any disk in the cluster.</li>
<li>It simplifies the storage subsystem. The subsystem deals with blocks rather than files, which simplifies storage management (fixed size makes it easy to calculate how many fit on a disk) and <strong>eliminates metadata concerns</strong>.</li>
<li>Blocks fit well with replication for fault tolerance and availability. To insure against corrupted blocks and disk and machine failure, each block is replicated to a small number of physically separate machines &mdash; typically three.</li>
</ol>

<div class="concept-box key">
<h4>Why the block is so large &mdash; the calculation to reproduce</h4>
<p>To minimise the cost of seeks. By making a block large enough, the time to transfer the data from disk can be made significantly larger than the time to seek to the start of the block, so a large file made of multiple blocks transfers at the disk transfer rate. The number: if seek time is about 10 ms and the transfer rate is 100 MB/s, then to make the seek time 1% of the transfer time the block size must be about 100 MB. Hence the 64/128 MB defaults: the figure is revised upward as transfer speeds grow.</p>
</div>
<h3>Namenodes and datanodes &mdash; the architecture</h3>
<figure class="figure-wide figure-wrap">
<svg class="figure wide" viewBox="0 0 780 340" role="img" aria-label="HDFS master-worker architecture: a client asks the NameNode for block locations, then reads or writes block data directly to DataNodes, which store blocks and report periodically to the NameNode">
<defs><marker id="f4b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="flow-arrow-head"/></marker></defs>

<rect class="flow-box phase1" x="30" y="120" width="150" height="46" rx="9"/>
<text class="flow-text" x="105" y="142">Client &mdash; needs</text>
<text class="flow-text" x="105" y="160">a file</text>

<rect class="flow-box phase2" x="315" y="30" width="230" height="60" rx="9"/>
<text class="flow-text" x="430" y="54">NameNode (master)</text>
<text class="flow-label" x="430" y="76" text-anchor="middle">namespace &middot; filesystem tree and metadata</text>

<rect class="flow-box phase3" x="270" y="140" width="180" height="46" rx="9"/>
<text class="flow-text" x="360" y="168">DataNode 1</text>
<rect class="flow-box phase3" x="480" y="140" width="180" height="46" rx="9"/>
<text class="flow-text" x="570" y="168">DataNode N</text>
<rect class="flow-box phase3" x="270" y="215" width="390" height="46" rx="9"/>
<text class="flow-text" x="465" y="243">Blocks stored as plain files on the local disk &mdash; replicated 3&times;</text>

<path class="flow-arrow" d="M182,132 L312,80" marker-end="url(#f4b)"/>
<text class="flow-label" x="228" y="92" text-anchor="middle">1. metadata request</text>
<path class="flow-arrow" d="M312,96 L182,150" marker-end="url(#f4b)"/>
<text class="flow-label" x="252" y="132" text-anchor="middle">2. block locations</text>
<path class="flow-arrow" d="M184,158 H266" marker-end="url(#f4b)"/>
<text class="flow-label" x="226" y="200" text-anchor="middle">3. read/write</text>
<text class="flow-label" x="226" y="220" text-anchor="middle">block data</text>
<path class="flow-arrow" d="M360,138 V92" marker-end="url(#f4b)"/>
<path class="flow-arrow" d="M570,138 V92" marker-end="url(#f4b)"/>
<text class="flow-label" x="640" y="118" text-anchor="middle">block reports</text>
<text class="flow-label" x="640" y="136" text-anchor="middle">(periodic)</text>

<text class="flow-label" x="390" y="300" text-anchor="middle">The NameNode knows <tspan class="flow-em">where</tspan> every block is; the data itself never passes through it.</text>
<text class="flow-label" x="390" y="322" text-anchor="middle">That is the design decision that lets one master serve a very large cluster.</text>
</svg>
<figcaption>Fig 4.2 &mdash; HDFS in a master&ndash;worker pattern. The same separation appears in GFS: data does not flow across the master &mdash; the client asks the master for the chunk handle and locations, caches the metadata, and then talks to a chunkserver directly for the bytes.</figcaption>
</figure>

<p>An HDFS cluster has two types of node operating in a master&ndash;worker pattern: a namenode (the master) and a number of datanodes (the workers). The architecture in these terms: the NameNode is the master of HDFS and directs the slave DataNode daemons to perform the low-level I/O tasks. It keeps track of the file's splitting into blocks, its replication, and where those blocks are located. A Secondary NameNode takes snapshots of the NameNode, which is the checkpoint mechanism that keeps the namespace image and edit log from growing without bound &mdash; not a failover standby, which is the usual misreading of the name. The architecture includes the daemon layout of a real cluster: one node running the name-node daemon, and every slave node running a datanode daemon over its own local Linux filesystem, reporting to the master.</p>
<table class="comparison-table">
<thead>
<tr><th></th><th>NameNode (master)</th><th>DataNode (worker)</th></tr>
</thead>
<tbody>
<tr><td><strong>Role</strong></td><td>Manages the <strong>filesystem namespace</strong>: it maintains the filesystem tree and the metadata for all files and directories in the tree.</td><td>The <strong>workhorses of the filesystem</strong>: they store and retrieve blocks when told to (by clients or the namenode).</td></tr>
<tr><td><strong>Persistence</strong></td><td>Metadata is stored persistently on the local disk in the form of two files: the namespace image and the edit log.</td><td>Blocks are stored as independent units on local disk.</td></tr>
<tr><td><strong>What it knows</strong></td><td>Which datanodes hold all the blocks for a given file; it determines the mapping of blocks to datanodes and regulates access to files by clients, including opening, closing and renaming files and directories.</td><td>Report back to the namenode periodically with lists of blocks they are storing, and perform block creation, deletion and replication on the instruction of the namenode.</td></tr>
</tbody>
</table>

<p>The wider Hadoop design is the same shape: master: NameNode, JobTracker; slave: {DataNode, TaskTracker} repeated across the cluster, with HDFS being one primary component of the Hadoop cluster.</p>
<h3>Why the NameNode is a single point of failure, and the three remedies</h3>
<p>If the machine running the namenode fails, all the files on the filesystem would be lost, because there would be no way of knowing how to reconstruct the files from the blocks on the datanodes. That is the fault HDFS's recovery design is aimed at, and these are the mechanisms that answer it:</p>

<table class="comparison-table">
<thead>
<tr><th>Mechanism</th><th>How it works</th></tr>
</thead>
<tbody>
<tr><td>1. Backing up the persistent metadata state</td><td>Hadoop can be configured so that the namenode writes its persistent state to multiple filesystems. These writes are synchronous and atomic. The usual configuration is to write to local disk as well as a remote NFS mount.</td></tr>
<tr><td>2. The secondary namenode</td><td>Despite its name it does not act as a namenode. Its main role is to periodically merge the namespace image with the edit log to prevent the edit log from becoming too large &mdash; but it can be shaped to act as the primary namenode. Its two purposes are checkpointing in normal operation and a fallback if the primary is lost.</td></tr>
<tr><td>3. HDFS Federation (0.23 series)</td><td>A <strong>scalability</strong> mechanism rather than a recovery one: because the namenode keeps a reference to every file and block in memory, memory becomes the limiting factor on very large clusters. Federation allows a cluster to scale by adding namenodes, each managing a portion of the filesystem namespace &mdash; one might manage everything under <code>/user</code>, another everything under <code>/share</code>. Namespace volumes are independent, namenodes do not communicate, and the failure of one does not affect the availability of the others &mdash; but block pool storage is not partitioned, so datanodes register with every namenode and store blocks from multiple block pools.</td></tr>
</tbody>
</table>
<h3>HDFS high availability, failover and fencing</h3>
<p>The namenode is still a single point of failure (SPOF): if it fails, all clients &mdash; including MapReduce jobs &mdash; would be unable to read, write or list files, because it is the sole repository of the metadata and the file-to-block mapping. The whole Hadoop system would effectively be out of service until a new namenode could be brought online.</p>

<p>Recovering the old way means an administrator starts a new primary namenode from one of the metadata replicas and reconfigures datanodes and clients to use it. The new namenode cannot serve requests until it has (i) loaded its namespace image into memory, (ii) replayed its edit log, and (iii) received enough block reports from the datanodes to leave safe mode. On large clusters a cold start can take 30 minutes or more.</p>

<p><strong>HDFS high availability</strong> (0.23 series) does better by running a pair of namenodes in an active&ndash;standby configuration, where on failure of the active namenode the standby takes over its duties and continues servicing client requests without significant interruption. Three architectural changes are needed:</p>
<ul>
<li>The namenodes must use highly available shared storage to share the edit log.</li>
<li>Datanodes must send block reports to both namenodes, because the block mappings are stored in a namenode's memory and not on disk.</li>
<li>Clients must be configured to handle namenode failover, using a mechanism that is <strong>transparent to users</strong>.</li>
</ul>
<p>The transition is managed by a <strong>failover controller</strong>; controllers are pluggable, and the first implementation uses ZooKeeper to ensure only one namenode is active. Failover may also be initiated manually by an administrator, for routine maintenance &mdash; a graceful failover, in which the controller arranges an orderly role switch for both namenodes. In an ungraceful failover, the implementation goes to great lengths to ensure the previously active namenode cannot do any damage or cause corruption &mdash; a method known as fencing.</p>

<h3>GFS, and how HDFS relates to it</h3>
<p>HDFS was inspired by GFS (the Google File System), and GFS's assumptions and read path explain HDFS's shape. GFS is one way &mdash; not the only way &mdash; to design a distributed file system.</p>
<p>GFS's design is based on Google's main use cases, and every assumption reappears as an HDFS property:</p>
<ul>
<li><strong>Hardware failures are common</strong> (commodity hardware).</li>
<li>Files are large (GB/TB) and their number is limited (millions, not billions).</li>
<li>Two main types of reads: large streaming reads and small random reads.</li>
<li>Workloads with sequential writes that append data to files &mdash; which is exactly HDFS's "write-once, read-many, writes always at the end".</li>
<li>Once written, files are seldom modified again (other than appending); random modification is possible but not efficient in GFS.</li>
<li>High sustained bandwidth trumps low latency &mdash; the design goal that makes HDFS unsuitable for the tens-of-milliseconds range.</li>
</ul>
<p>The GFS architecture is a single master holding metadata plus many chunkservers holding chunks, with several clients. Files are divided into fixed-size chunks (64 MB) with unique 64-bit identifiers assigned by the master at chunk creation time, and chunkservers store chunks on local disk as normal Linux files; reading and writing is specified by the tuple (chunk handle, byte range). The master maintains <strong>all file system metadata</strong> &mdash; namespace, access control information, the mapping from files to chunks and the locations of chunk replicas &mdash; and files are replicated by default three times across chunkservers. <strong>Heartbeat messages</strong> between master and chunkservers answer two questions: is the chunkserver still alive, and what chunks does it store?</p>
<p>The read path has five steps, and it is the clearest statement of the master/worker split:</p>
<ol>
<li>The client translates the filename and byte offset specified by the application into a chunk index within the file, and sends the request to the master.</li>
<li>The master replies with the chunk handle and the locations of the replicas.</li>
<li>The client caches the metadata.</li>
<li>The client sends a data request to one of the replicas &mdash; the closest one. The byte range indicates the wanted part of the chunk, and more than one chunk can be included in a single request.</li>
<li>The contacted chunkserver replies with the requested data.</li>
</ol>
<p>Metadata is of <strong>three types</strong> &mdash; files and chunk namespaces, the mapping from files to chunks, and the locations of each chunk's replicas. All of it is kept in the master's memory for fast random access, which sets limits on the entire system's capacity (compare HDFS federation). An operation log is kept on the master's local disk so that the master's state can be recovered after a crash: namespaces and mappings are logged, but chunk locations are not. The master asks the chunkservers instead, which is why the chunkserver has the final word over what chunks it has.</p>
<h3>Where the three replicas go, and what happens when one is lost</h3>
<p>Replication is only as good as where the copies are put, and the placement rules are policy rather than a derivation. Four of them:</p>
<ol>
<li><strong>Spread across racks</strong> &mdash; a rack is one failure domain, so a switch, a power feed or a cooling failure takes out every machine in it at once. Copies in different racks survive the loss of a whole rack; three copies in one rack do not.</li>
<li><strong>Prefer under-utilised chunkservers</strong> &mdash; a new chunk should not land on a machine that is already serving the most traffic.</li>
<li><strong>Limit recent creations</strong> &mdash; so a burst of new chunks does not concentrate on one machine, which would recreate the hot spot rule 2 avoids.</li>
<li><strong>Re-replication</strong> &mdash; when the available copies of a chunk fall below the configured level, the master instructs a chunkserver to copy the chunk directly from an existing valid replica. The number of those clone operations, and the bandwidth they may use, is limited, so that recovery does not compete with serving reads.</li>
</ol>
<div class="concept-box key">
<h4>Why the placement rules matter more than the count</h4>
<p>Three copies on one machine is not three replicas, it is one replica and two things that fail with it. The rules above answer the same risk three times over: correlated failure. Copies on separate machines survive a dead machine, copies in separate racks survive a dead rack, and the replication level is what turns "a machine died" into "the data is back to full replication without an administrator". Only the last rule needs the master, which is why every chunkserver reports its block list to the master and the data itself never passes through it.</p>
</div>

<h2>4.3 Middleware: CORBA, Java RMI, Messaging MQTT, AMQP</h2>

<h3>Heterogeneity, and why middleware exists</h3>
<p>Distributed applications are typically heterogeneous:</p>
<ul>
<li><strong>Different hardware</strong> &mdash; mainframes, workstations, PCs, servers.</li>
<li><strong>Different software</strong> &mdash; UNIX, MS Windows, IBM OS/2, real-time operating systems.</li>
<li><strong>Unconventional devices</strong> &mdash; teller machines, telephone switches, robots, manufacturing systems.</li>
<li>Diverse networks and protocols &mdash; Ethernet, FDDI, ATM, TCP/IP, Novell NetWare.</li>
</ul>
<p>And <em>why</em> it is heterogeneous: different hardware and software solutions are considered optimal for different parts of the system; different users who have to interact decide on different hardware, software and vendors; and <strong>legacy systems</strong> must be kept working.</p>

<div class="concept-box key">
<h4>What middleware is</h4>
<p>A key component of a heterogeneous distributed client&ndash;server environment is middleware: a set of services that enable applications and end users to interact with each other across a heterogeneous distributed system. Middleware software resides above the network and below the application software. The two jobs it must do are to make the network transparent to applications and end users &mdash; so users and applications can perform the same operations across the network that they can perform locally. The second is to hide the details of computing hardware, operating system and software components across networks. A range of software qualifies to a certain extent: file-transfer packages (FTP) and email, web browsers, and CORBA.</p>
</div>
<h3>CORBA</h3>
<p>The <strong>Object Management Group (OMG)</strong> is a non-profit industry consortium formed in 1989 with the goal of developing, adopting and promoting standards for distributed heterogeneous applications. One of its main achievements is the specification of the Common Object Request Broker Architecture (CORBA), which details the interfaces and characteristics of the Object Request Broker. It practically specifies the middleware functions that allow application objects to communicate no matter where they are located, who designed them, and in which language they are implemented.</p>

<div class="concept-box warn">
<h4>CORBA is a standard, not a product</h4>
<p>OMG only provides a specification. There are several products which, to a certain extent, implement the specification. So CORBA is a standard, not a piece of software &mdash; and "CORBA is a language" or "CORBA is a product" are both wrong. It is <em>language-neutral and vendor-neutral middleware defined by an IDL</em>.</p>
</div>

<h4>The object model CORBA specifies</h4>
<p><strong>Key concepts.</strong> CORBA specifies the middleware services used by application objects. An object can be a client, a server, or both. Object interaction is through requests, where the information associated with a request is an operation to be performed, a target object, and zero or more parameters. CORBA supports both static and dynamic binding, where dynamic binding uses runtime identification of objects and parameters. The interface represents the contract between client and server; an IDL has been defined for CORBA, and proxies and skeletons (the client and server stubs) are generated as a result of IDL compilation. Finally, CORBA objects do not know the underlying implementation details &mdash; an object adapter maps the generic model to a specific implementation.</p>
<h4>The two repositories: what makes dynamic invocation possible</h4>
<table class="comparison-table">
<thead>
<tr><th>Repository</th><th>What it holds</th><th>Why it matters</th></tr>
</thead>
<tbody>
<tr><td><strong>Interface repository</strong></td><td>A standard representation of available object interfaces for all objects in the distributed environment, corresponding to the server objects' IDL specification. For an interface of a given type it supplies the names of the methods and, for each method, the names and types of the arguments and exceptions.</td><td>Clients access it to learn about server objects and determine which operations can be invoked and with which parameters &mdash; this is what makes dynamic invocation possible, the facility for reflection in CORBA. The IDL compiler gives each type a type identifier which is included in remote object references as the repository ID. Applications using static invocation with proxies and IDL skeletons do not require an interface repository, and not all ORBs provide one.</td></tr>
<tr><td><strong>Implementation repository</strong></td><td>Implementation details for the objects implementing each interface: mainly a mapping from the server object's name to the file name implementing the service, plus information about object methods and what is needed for method selection. It activates registered servers on demand and locates running servers, uses the object adapter name to register and activate servers, and stores a mapping from object adapter names to pathnames of files containing object implementations. When an object implementation is activated, the hostname and port number of the server are added to the mapping. An entry is: object adapter name | pathname of object implementation | hostname and port number. Information in it can be operating-system specific and can differ between CORBA implementations, and access control information can be stored in it.</td><td>The object adapter uses it to resolve an incoming call and activate the right object method via a server skeleton. Not all CORBA objects (callbacks, for example) need be activated on demand.</td></tr>
</tbody>
</table>

<h4>Remote object references: IORs</h4>
<p><strong>Remote object references.</strong> CORBA 2.0 introduced Interoperable Object References (IORs), which are suitable whether or not the object is activatable. Transient IORs are for objects that last as long as the host process and contain the address of the server hosting the CORBA object: the server ORB core receives the request containing the object adapter name and object name of the target. It uses the adapter name to locate the object adapter; that adapter uses the object name to locate the servant. Persistent IORs last between activations and contain the address of the implementation repository: the repository receives the request, activates the object, then gives the server address to the client, and the client sends subsequent invocations to the server. The IOR format is IDL interface type name | protocol and address details | object key, where the address details are IIOP, host domain name and port number, and the object key holds the interface repository identifier, adapter name and object name.</p>

<h4>The ORB, and how two ORBs talk to each other</h4>
<p>Inter-ORB architecture. Because ORB implementations differ from vendor to vendor, interaction between objects on different CORBA implementations needs a common protocol:</p>
<ul>
<li><strong>GIOP (General Inter-ORB Protocol)</strong> is defined in CORBA 2.0 and specifies a set of message formats and common data representations for interactions between ORBs, intended to operate over any connection-oriented transport protocol.</li>
<li><strong>IIOP (Internet Inter-ORB Protocol)</strong> is a particularisation of GIOP: it specifies how GIOP messages have to be exchanged over a TCP/IP network.</li>
</ul>
<p>The Object Request Broker (ORB) is the core: through its interfaces it provides mechanisms by which objects transparently interact with each other. Issuing a request can be dynamic or static, performed through the proxies (client stubs) or the dynamic invocation interface. Invocation of a specific server method is performed by the server skeleton, which gets the request forwarded from the object adapter. The ORB interface can also be accessed directly by clients and object implementations for certain services &mdash; directory services, naming services, and manipulation of object references. Some of its interfaces are identical for all ORB implementations and some are implementation dependent.</p>
<h4>Static versus dynamic invocation</h4>

<table class="comparison-table">
<thead>
<tr><th></th><th>Static invocation</th><th>Dynamic invocation</th></tr>
</thead>
<tbody>
<tr><td>What it is based on</td><td>Compile-time knowledge of the server's interface specification, formulated in IDL and compiled into a proxy (client stub) in the client's programming language.</td><td>Allows a client to invoke requests on an object without compile-time knowledge of its interface; the object and its interface (methods, parameters, types) are detected at run time.</td></tr>
<tr><td><strong>Mechanism</strong></td><td>For the client an object invocation looks like a local invocation to a proxy method; the invocation is then automatically forwarded to the object implementation through the ORB, the object adapter and the skeleton.</td><td>CORBA provides, through the dynamic invocation interface, mechanisms to inspect the interface repository, construct invocations dynamically, and supply argument values matching the server's interface specification.</td></tr>
<tr><td>Cost and effect</td><td>Efficient at run time because of the relatively low overhead.</td><td>The execution overhead of a dynamic invocation is huge &mdash; the interface is discovered and the request built at runtime.</td></tr>
<tr><td><strong>The server's view</strong></td><td colspan="2"><strong>Identical.</strong> From the server's point of view static and dynamic invocation are the same; the server does not know how it has been invoked, because server invocation is always issued through its skeleton, generated at compile time from the IDL specification.</td></tr>
</tbody>
</table>
<h4>The object adapter</h4>
<p>The Object Adapter (OA) is the primary interface between the server object implementation and the ORB, and it bridges the gap between CORBA objects with IDL interfaces and the programming language interfaces of the corresponding servant classes. Its tasks: it creates remote object references for CORBA objects; it dispatches each remote invocation via a skeleton to the appropriate servant; and it activates objects. It gives each CORBA object a unique object name, the same name being used each time the object is activated, and keeps a remote object table mapping names of CORBA objects to servants. Each adapter has its own name, specified by the application or generated automatically. The services a Basic Object Adapter provides are object registration (entities written in a given language are registered as CORBA objects), object reference generation, object upcalls (dispatching incoming requests to registered objects) and server process and object activation.</p>

<h4>CORBA services</h4>
<p>CORBA services — current products implement only some of them:</p>
<table class="comparison-table">
<thead>
<tr><th>Service</th><th>What it provides</th></tr>
</thead>
<tbody>
<tr><td>Naming and Trading</td><td>The basic way an object reference is generated is at creation of the object, when the reference is returned; references can be stored with associated information such as names and properties. The naming service allows clients to find objects based on names; the trading service allows clients to find objects based on their properties, locating CORBA objects by attribute.</td></tr>
<tr><td><strong>Security</strong></td><td>Protects components from unauthorized users: authentication, access control lists, confidentiality; authentication of principals and access control of CORBA objects with policies; auditing by servers and facilities for non-repudiation.</td></tr>
<tr><td><strong>Time</strong></td><td>Interfaces for <strong>synchronizing time</strong> and operations for defining and managing time-triggered events.</td></tr>
<tr><td>Event and Notification</td><td>In the event service, suppliers and consumers communicate via an event channel; the notification service extends this to allow filtering and typed events.</td></tr>
<tr><td>Transaction and Concurrency Control</td><td>The transaction service provides flat or nested transactions and two-phase-commit coordination among recoverable components; the concurrency control service provides locking of CORBA objects and a lock manager that can obtain and free locks for transactions or threads.</td></tr>
<tr><td><strong>Persistent Object</strong></td><td>For storing the state of CORBA objects in a passive form and retrieving it.</td></tr>
</tbody>
</table>

<h3>Java RMI as middleware</h3>
<p>The syllabus names Java RMI alongside CORBA as middleware, and the comparison is the point: CORBA is language-neutral middleware defined by an IDL, while Java RMI is a language-specific middleware built into one language. RMI extends the Java object model to provide support for distributed objects, lets objects invoke methods on remote objects using the same syntax as for local invocations. It applies type checking equally to remote and local calls. It also provides a <strong>binder</strong> mapping textual names to remote object references. Its cost is that it is a <strong>single-language system</strong>.</p>

<p>RMI is <em>language-specific</em> middleware. It supplies a programming abstraction over the network, so that one object can call another wherever it runs, but only inside a Java system. In a heterogeneous estate that is not enough, and CORBA's IDL exists precisely to remove that limit; inside a homogeneous Java system it is valuable, because the abstraction costs a programmer nothing to adopt and the type checking is the language's own. The one-line rule: CORBA's interface is defined in a neutral language, Java RMI's is the language itself. Everything else &mdash; the binder, the proxy and the skeleton, at-most-once semantics &mdash; is the same machinery under two names.</p>

<h3>Messaging middleware: MQTT and AMQP</h3>
<p>The third family is message-oriented middleware. It is one of four messaging protocols — CoAP, MQTT, AMQP and XMPP.</p>

<p>MQTT (Message Queuing Telemetry Transport) is a messaging protocol designed for publish&ndash;subscribe messaging between lightweight devices. It is designed for unreliable networks or intermittent connectivity, for exchanging data with the cloud, and it is very popular and widespread for IoT and M2M applications where it has become a standard. On the stack it sits <strong>over TCP</strong> &mdash; and a variant, MQTT-SN (Sensor Networks), can use other transport protocols such as UDP or Bluetooth.</p>
<figure class="figure-wide figure-wrap">
<svg class="figure wide" viewBox="0 0 780 300" role="img" aria-label="MQTT publish-subscribe model: publishers send messages to a broker, which forwards them to subscribers that have registered interest in a topic; the broker decouples publisher from subscriber">
<defs><marker id="f4c" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="flow-arrow-head"/></marker></defs>

<rect class="flow-box phase1" x="40" y="40" width="170" height="46" rx="9"/>
<text class="flow-text" x="125" y="68">Publisher (client B)</text>
<rect class="flow-box phase1" x="40" y="190" width="170" height="46" rx="9"/>
<text class="flow-text" x="125" y="218">Publisher</text>

<rect class="flow-box phase2" x="305" y="100" width="170" height="76" rx="9"/>
<text class="flow-text" x="390" y="128">Broker</text>
<text class="flow-label" x="390" y="150" text-anchor="middle">receives data from publishers,</text>
<text class="flow-label" x="390" y="166" text-anchor="middle">forwards it to interested subscribers</text>

<rect class="flow-box phase3" x="570" y="40" width="170" height="46" rx="9"/>
<text class="flow-text" x="655" y="68">Subscriber (client A)</text>
<rect class="flow-box phase3" x="570" y="190" width="170" height="46" rx="9"/>
<text class="flow-text" x="655" y="218">Subscriber</text>

<path class="flow-arrow" d="M214,72 L301,110" marker-end="url(#f4c)"/>
<text class="flow-label" x="248" y="86" text-anchor="middle">PUBLISH</text>
<text class="flow-label" x="248" y="104" text-anchor="middle">&quot;/temp&quot;</text>
<path class="flow-arrow" d="M214,208 L301,168" marker-end="url(#f4c)"/>
<text class="flow-label" x="248" y="204" text-anchor="middle">PUBLISH</text>

<path class="flow-arrow" d="M479,110 L566,72" marker-end="url(#f4c)"/>
<text class="flow-label" x="520" y="86" text-anchor="middle">deliver</text>
<path class="flow-arrow" d="M479,168 L566,208" marker-end="url(#f4c)"/>
<text class="flow-label" x="520" y="204" text-anchor="middle">deliver</text>
<path class="flow-arrow" d="M566,196 H483" stroke-dasharray="4 3"/>
<text class="flow-label" x="524" y="240" text-anchor="middle">SUBSCRIBE &quot;/temp&quot;</text>

<text class="flow-label" x="390" y="278" text-anchor="middle">The publisher never names a receiver, and the subscriber never names a sender &mdash; the broker and the topic decouple them.</text>
</svg>
<figcaption>Fig 4.3 &mdash; The MQTT model. Broker: a server that receives the data from publishers and forwards it to the interested subscribers. Publisher: a client that sends data to the broker. Subscriber: a client registered on the broker to receive updates from specific sources. The example interaction is CONNECT/CONNACK, SUBSCRIBE &quot;/temp&quot;/SUBACK, PUBLISH &quot;item&quot;/PUBACK between broker, subscriber (client A) and publisher (client B).</figcaption>
</figure>
<p><strong>The MQTT message format</strong> is what "lightweight" means concretely. A <strong>1-byte control header</strong> and a 1-to-4-byte packet length form a fixed header that is always present, followed by a variable-length header whose size depends on the message type and which is not always present. Then come 0&ndash;Y bytes of payload &mdash; the actual data to send. The payload may not be present, for example in CONNACK.</p>
<p>AMQP (Advanced Message Queuing Protocol) is a lightweight but binary application-layer messaging protocol designed for M2M messaging. It is generally used in corporate environments, focuses on interoperability, and supports both the publish&ndash;subscribe and request&ndash;response models. Its architecture is built on a broker and multiple queues.</p>
<table class="comparison-table">
<thead>
<tr><th></th><th>MQTT</th><th>AMQP</th></tr>
</thead>
<tbody>
<tr><td><strong>Model</strong></td><td><strong>Publish&ndash;subscribe</strong> through a broker, with topics.</td><td>Supports both publish&ndash;subscribe and request&ndash;response, with queues and exchanges.</td></tr>
<tr><td><strong>Encoding</strong></td><td>Compact binary framing: 1-byte control header, 1&ndash;4-byte length, optional variable header and payload.</td><td><strong>Binary application-layer</strong> protocol &mdash; more featureful.</td></tr>
<tr><td><strong>Designed for</strong></td><td>Unreliable networks or intermittent connectivity; lightweight devices; IoT and M2M.</td><td><strong>M2M messaging</strong> in general, with interoperability as the focus; generally corporate environments.</td></tr>
<tr><td><strong>Transport</strong></td><td><strong>Over TCP</strong>; MQTT-SN can use UDP or Bluetooth.</td><td>Application layer, typically over TCP.</td></tr>
<tr><td><strong>Both are listed with</strong></td><td colspan="2"><strong>CoAP</strong> and XMPP as the other two protocols compared — CoAP for constrained devices, XMPP an older XML-based messaging standard.</td></tr>
</tbody>
</table>

<div class="concept-box tip">
<h4>The three families in one line</h4>
<p>CORBA is the object-oriented, language-neutral, IDL-defined family &mdash; remote method invocation between heterogeneous objects through an ORB. Java RMI is the same idea inside one language, with the binder playing the role of the naming service. MQTT and AMQP are message-oriented, and they differ from both in that the sender and receiver are <em>decoupled</em>: the sender publishes to a broker or an exchange and never names a receiver. That is what makes them suit intermittent connectivity and large numbers of devices. All three exist for the same reason middleware exists at all &mdash; heterogeneity &mdash; and all three sit above the network and below the application.</p>
</div>

<p class="past-pointer">Questions on this unit, with model answers, are on the <a href="#/ch/4/past">Past Questions</a> tab.</p>
`,

  revise: {"what-a-dfs-is":"<p>A <strong>Distributed File System</strong> is a classical file system spread across multiple machines, sharing dispersed files.</p>\n<ul>\n<li>Resources on another machine are remote; on the local machine they are local.</li>\n<li>It enables programs to store and access remote files exactly as they do local ones.</li>\n<li>Clients should view it the same way as a centralized file system, with the distribution hidden at a lower level.</li>\n<li>Performance is judged by two numbers: <strong>throughput</strong> and <strong>response time</strong>.</li>\n</ul>\n","the-design-goals":"<p>Eight concepts, requirements and design goals apply to a DFS.</p>\n<ul>\n<li><strong>Transparency</strong>: the distribution is invisible, and remote files are used as local ones.</li>\n<li><strong>Concurrency</strong>, <strong>replication</strong>, <strong>heterogeneity</strong> and <strong>fault tolerance</strong>.</li>\n<li><strong>Consistency</strong>: all readers see updates according to a defined rule, despite caching and replication.</li>\n<li><strong>Security</strong> applies to remote files as strictly as to local ones, and <strong>efficiency</strong> means throughput and response time close to a local file system's.</li>\n</ul>\n","transparency":"<p>Transparency in a DFS is the family of properties applied to files.</p>\n<ul>\n<li>The strict form is <strong>access transparency</strong>: the same operations on a remote file as on a local one, with the same result.</li>\n<li>The others are location, migration, relocation, replication, concurrency, failure and persistence.</li>\n<li>NFS is described as having access transparency as its design goal, where most other systems have something else.</li>\n</ul>\n","naming-three-schemes-and-the-mapping-underneath":"<p>Naming maps logical objects to physical ones, and the three schemes differ in location transparency.</p>\n<ul>\n<li>Host plus local name: unique, but neither location transparent nor location independent.</li>\n<li>Remote directories mounted to local ones: location independent, but the directories must be explicitly mounted &mdash; SUN NFS is the example.</li>\n<li>A single global name structure spans all files, giving the strongest illusion of one system.</li>\n<li>A transparent mapping goes name &rarr; <strong>file_identifier</strong> &rarr; &lt;system, disk, cylinder, sector&gt;, so moving a file changes only the unique identifier.</li>\n</ul>\n","the-file-service-architecture":"<p>The file service is structured into three components: the <strong>flat file service</strong>, the <strong>directory service</strong> and the <strong>client module</strong>.</p>\n<ul>\n<li>The flat file service acts on the contents of files, referring to them by <strong>UFID</strong>.</li>\n<li>The directory service maps text names to UFIDs, and supports creating directories and adding files.</li>\n<li>The client module runs on each computer and gives applications a single API for both services.</li>\n<li>It holds the network locations of the servers and caches recently used file blocks.</li>\n</ul>\n","consistency-in-a-dfs":"<p><strong>Consistency</strong> is the requirement that all clients see the effects of updates by a defined rule when a file is replicated or cached.</p>\n<ul>\n<li>It is unavoidable: caching is mandatory for performance, replication for availability, and concurrent access is normal.</li>\n<li>The ends are strict consistency, where every read sees the most recent write at once, and relaxed consistency, where staleness is bounded.</li>\n<li>NFS chooses relaxed consistency: close-to-open, with a consistency window of 30 seconds.</li>\n</ul>\n","replication":"<p>Replication means multiple copies of a file, and a transparent DFS returns a set of locations for the replicas.</p>\n<ul>\n<li>Availability and fault tolerance: if one server or disk fails, another copy answers &mdash; the purpose in HDFS.</li>\n<li>Performance: a read can be served by the nearest or least-loaded replica.</li>\n<li>The systems differ: NFS minimal, Coda with read-one/write-all, Plan 9 none, xFS striping for bandwidth.</li>\n<li>Replication has three motivations &mdash; availability, read performance and bandwidth &mdash; and consistency is the price of the first.</li>\n</ul>\n","sun-nfs-what-it-is":"<p>SUN NFS was developed by Sun Microsystems in 1985, the first commercially successful network file system.</p>\n<ul>\n<li>It was developed for diskless workstations, and designed for robustness and adequate performance rather than the best possible performance.</li>\n<li>Sun published all the protocol specifications, which is why NFS became a standard rather than a product.</li>\n<li>It is both an implementation and a specification; its goal is to share a file system transparently.</li>\n<li>It uses the client-server model, though a node can be both at once and there is no dedicated server.</li>\n</ul>\n","stateful-versus-stateless-services":"<p>NFS's most consequential decision is that it is <strong>stateless</strong>: every client request provides the complete information the server needs.</p>\n<ul>\n<li>A stateful server keeps track of client requests &mdash; which files are open, connection identifiers, caches.</li>\n<li>A stateful server performs better, since the filename is not parsed on every request.</li>\n<li>A stateless server has nothing to reclaim or lose, so it recovers easily and the client simply retries.</li>\n<li>Its cost is that every request repeats the lookup, which is why client caching compensates.</li>\n</ul>\n","nfs-s-design-and-its-three-parts":"<p>NFS's design has three parts: the <strong>protocol</strong>, the server side and the client side.</p>\n<ul>\n<li>The protocol uses the Sun RPC mechanism and the Sun eXternal Data Representation (XDR), defined as a set of remote procedures.</li>\n<li>The server's <strong>file handle</strong> holds a filesystem id, an i-node number and a generation number.</li>\n<li>The client side gives a transparent interface: remote mount maps remote names to addresses, with VFS and VNODE calls.</li>\n<li>Since the server is stateless, identity and access rights are checked on every request, which carries its userID and groupID.</li>\n</ul>\n","hdfs-design-and-why-it-is-shaped-that-way":"<p><strong>HDFS</strong> stores very large files with streaming data access, on clusters of commodity hardware.</p>\n<ul>\n<li>Very large files: hundreds of megabytes to terabytes, with clusters holding petabytes.</li>\n<li>Streaming access: the pattern is write-once, read-many-times, a dataset generated once then analysed many times.</li>\n<li>Commodity hardware: node failure is expected, and HDFS carries on without a noticeable interruption.</li>\n<li>It is a poor fit for low-latency data access, lots of small files, and multiple writers.</li>\n</ul>\n","blocks":"<p>HDFS has a <strong>block</strong>, a much larger unit: 64 MB by default, often 128 MB.</p>\n<ul>\n<li>Files are broken into block-sized chunks stored as independent units.</li>\n<li>A file can therefore be larger than any single disk, and the storage subsystem deals with blocks rather than files, which eliminates metadata concerns.</li>\n<li>Blocks fit replication: each is replicated to a small number of separate machines, typically three.</li>\n<li>Largeness minimises the cost of seeks: about 10 ms of seek against 100 MB/s gives about 100 MB.</li>\n</ul>\n","namenodes-and-datanodes-the-architecture":"<p>An HDFS cluster has a <strong>namenode</strong> as master and <strong>datanodes</strong> as workers.</p>\n<ul>\n<li>The namenode manages the filesystem namespace: the tree and the metadata for all files and directories.</li>\n<li>It knows which datanodes hold every block, and the data itself never passes through it.</li>\n<li>Metadata is persisted as two files: the namespace image and the edit log.</li>\n<li>Datanodes store and retrieve blocks when told to, and report the blocks they hold periodically.</li>\n<li>A Secondary NameNode takes snapshots, keeping the namespace image and edit log from growing without bound.</li>\n</ul>\n","why-the-namenode-is-a-single-point-of-failure-and-the-three-remedies":"<p>If the machine running the namenode fails, all files would be lost, because nothing else knows how to reconstruct them.</p>\n<ul>\n<li>Back up the state: the namenode writes its persistent state to multiple filesystems, synchronously and atomically.</li>\n<li>A <strong>secondary namenode</strong> merges the namespace image with the edit log periodically, but does not act as a namenode.</li>\n<li><strong>HDFS Federation</strong> adds namenodes, each managing a portion of the namespace; they do not communicate, though datanodes register with all of them.</li>\n</ul>\n","hdfs-high-availability-failover-and-fencing":"<p>The namenode is still a single point of failure: if it fails, no client can read, write or list files.</p>\n<ul>\n<li>Recovery the old way is a cold start that can take 30 minutes or more on large clusters.</li>\n<li>High availability runs a pair of namenodes active-standby, so the standby takes over without significant interruption; it needs shared storage for the edit log, reports to both namenodes and client failover.</li>\n<li>A <strong>failover controller</strong> manages the transition, and an ungraceful failover is made safe by <strong>fencing</strong>.</li>\n</ul>\n","gfs-and-how-hdfs-relates-to-it":"<p>HDFS was inspired by <strong>GFS</strong>, the Google File System.</p>\n<ul>\n<li>Hardware failures are common, files are large and few, writes append.</li>\n<li>High sustained bandwidth is preferred to low latency.</li>\n<li>A single master holds the metadata, and many chunkservers hold fixed-size chunks of 64 MB with three replicas.</li>\n<li>The read path: the client asks the master for the chunk handle and replica locations, caches them, then asks the closest replica.</li>\n<li>An operation log recovers the master's state; chunk locations come from the chunkservers.</li>\n</ul>\n","where-the-three-replicas-go-and-what-happens-when-one-is-lost":"<p>The <strong>placement rules</strong> for replicas are policy rather than a derivation: spread the copies across racks, prefer under-utilised chunkservers, and limit recent creations on each of them.</p>\n<ul>\n<li>A rack is one failure domain, so copies in different racks survive the loss of a whole rack.</li>\n<li>When the available replicas fall below the setting, the master tells a chunkserver to copy from a valid replica, with the clones and their bandwidth limited.</li>\n<li>Three copies on one machine are one replica and two things that fail with it.</li>\n</ul>\n","heterogeneity-and-why-middleware-exists":"<p>Distributed applications are typically <strong>heterogeneous</strong>: different hardware, software, unconventional devices, and diverse networks and protocols.</p>\n<ul>\n<li>It happens because different solutions suit different parts, users choose their own vendors, and legacy systems must keep working.</li>\n<li><strong>Middleware</strong> is a set of services that enable applications and end users to interact across a heterogeneous distributed system.</li>\n<li>It resides above the network and below the application software.</li>\n<li>Its two jobs: make the network transparent to users and applications, and hide the hardware, operating system and software details.</li>\n</ul>\n","corba":"<p><strong>CORBA</strong> is the OMG's specification for an <strong>Object Request Broker</strong>.</p>\n<ul>\n<li>It is a standard rather than a product, language-neutral and vendor-neutral, defined by an <strong>IDL</strong>.</li>\n<li>Clients invoke through <strong>proxies</strong> and servers through <strong>skeletons</strong>, both generated from the IDL.</li>\n<li>The <strong>interface repository</strong> holds the available interfaces, which is what makes dynamic invocation possible.</li>\n<li><strong>GIOP</strong> defines the messages exchanged between ORBs, and <strong>IIOP</strong> is its particularisation over TCP/IP.</li>\n<li>Services include naming and trading, security, time, event and notification, transaction, and persistent objects.</li>\n</ul>\n","java-rmi-as-middleware":"<p><strong>Java RMI</strong> is language-specific middleware: CORBA's interface is defined in a neutral language, while RMI's is the language itself.</p>\n<ul>\n<li>RMI extends the Java object model to support distributed objects, letting objects invoke methods on remote objects with local syntax.</li>\n<li>Type checking applies equally to remote and local calls, and a <strong>binder</strong> maps textual names to remote object references.</li>\n<li>Its cost is that it is a single-language system, which is not enough in a heterogeneous estate.</li>\n</ul>\n","messaging-middleware-mqtt-and-amqp":"<p>The third family is message-oriented middleware: <strong>MQTT</strong>, <strong>AMQP</strong>, CoAP and XMPP.</p>\n<ul>\n<li>MQTT is publish-subscribe messaging for lightweight devices over unreliable networks or intermittent connectivity, popular for IoT and M2M.</li>\n<li>The publisher never names a receiver: a <strong>broker</strong> forwards data to interested subscribers and the topic decouples them.</li>\n<li>Its overhead: a 1-byte control header and a 1-to-4-byte packet length, then an optional variable header and payload.</li>\n<li>AMQP is a binary application-layer protocol for M2M messaging, supporting publish-subscribe and request-response with queues and exchanges.</li>\n</ul>\n"},
  pastSummary: `<h2>Exam-facing summary</h2>
<table class="comparison-table">
<thead>
<tr><th>If the question says&hellip;</th><th>Give&hellip;</th></tr>
</thead>
<tbody>
<tr><td>Define a distributed file system</td><td>A classical model of a file system distributed across multiple machines, promoting the sharing of dispersed files; resources on a machine are local, resources elsewhere are remote; programs access remote files exactly as local ones; performance measured by throughput and response time.</td></tr>
<tr><td>DFS design goals / requirements</td><td>Transparency, concurrency, replication, heterogeneity, fault tolerance, consistency, security, efficiency &mdash; one line each.</td></tr>
<tr><td>Explain the file service architecture</td><td>Flat file service (operations on contents, addressed by UFID), directory service (text name &rarr; UFID), client module (single API, server locations, block cache) &mdash; Fig 4.1.</td></tr>
<tr><td>Discuss naming in a DFS</td><td>The three schemes (host + local name &mdash; not location transparent; mounted remote directories &mdash; NFS; single global namespace), and the non-transparent versus transparent mapping.</td></tr>
<tr><td>Describe consistency in a DFS (4 marks)</td><td>The definition, why caching and replication force the problem, strict versus relaxed with ROWA at one end and NFS close-to-open with its 30-second window at the other, and the note that a cache consistency protocol is what makes caching safe.</td></tr>
<tr><td>Explain SUN NFS</td><td>Sun 1985, first commercially successful network file system, for diskless workstations, published protocol specifications, both implementation and specification, client&ndash;server with no dedicated server; stateless with self-contained requests for fast crash recovery; protocol on Sun RPC and XDR; the three-part file handle; remote mount, mount table, VFS/VNODE; uid/gid per request and Kerberos; the issue list.</td></tr>
<tr><td>Compare stateful and stateless services</td><td>The table &mdash; bookkeeping, performance and fault tolerance.</td></tr>
<tr><td>Explain the architecture of HDFS (4 marks)</td><td>Master&ndash;worker: NameNode managing the namespace with the namespace image and edit log on local disk and the block&ndash;datanode mapping in memory; DataNodes storing and serving blocks and sending periodic block reports; the client asking the NameNode for locations and reading data directly from a DataNode; blocks of 64/128 MB replicated three times.</td></tr>
<tr><td>How does HDFS ensure fault tolerance and scalability? (4 marks)</td><td>Fault tolerance: block replication (typically three, on physically separate machines), backup of the namenode's persistent state to multiple filesystems synchronously and atomically (local disk plus remote NFS), the secondary namenode merging the namespace image with the edit log, and HDFS high availability with active&ndash;standby namenodes, shared edit log, block reports to both, a failover controller using ZooKeeper, and fencing. Scalability: blocks larger than any single disk, federation adding namenodes each managing a portion of the namespace, and the observation that the in-memory metadata is what limits scaling.</td></tr>
<tr><td>What is GFS and how does it differ?</td><td>The assumptions (commodity hardware, large files, streaming reads, append-only writes, bandwidth over latency), the single master plus chunkservers, 64 MB chunks with 64-bit handles, 3&times; replication, the five-step read path, the three metadata types in memory, the operation log, and that data does not flow across the master.</td></tr>
<tr><td>What is middleware, and why is it needed?</td><td>The definition (services enabling interaction across a heterogeneous distributed system, above the network and below the application), the two jobs (network transparency, hiding hardware and OS details), and the reasons heterogeneity exists.</td></tr>
<tr><td>Explain CORBA</td><td>OMG 1989, a specification not a product, the ORB, requests as operation + target object + parameters, IDL with generated proxies and skeletons, static versus dynamic invocation, the object adapter, interface versus implementation repository, transient versus persistent IORs, GIOP/IIOP, and the services.</td></tr>
<tr><td>Explain MQTT and AMQP</td><td>MQTT as lightweight publish&ndash;subscribe for unreliable networks and IoT/M2M over TCP (with MQTT-SN over UDP/Bluetooth), broker/publisher/subscriber/topic, and the message format; AMQP as a binary application-layer protocol for M2M with interoperability as its focus, supporting both publish&ndash;subscribe and request&ndash;response with brokers and queues.</td></tr>
</tbody>
</table>


`,

  reference: `
<h2>Reference material</h2>
<p class="ref-intro">The teacher puts a circled <span class="tmark" aria-hidden="true"></span> on the slides he keeps for reference rather than for the paper. His decks carry the sign on 28 slides in all; 1 of them are pictures these notes had used, so they are collected here and the notes themselves teach only what the syllabus names. Each entry below says which section of the notes it came out of.</p>

<h3>CORBA</h3>

<p class="ref-meta">From <em>Chapter4_lecture_notes_all.pptx</em>, slide 35 &mdash; the teacher marks these slides, so the pictures are kept here and the notes keep the section itself, because the syllabus names it.</p>

<!-- dcc-fig:ch4/chapter4-lecture-notes-all-s35-078.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch4/chapter4-lecture-notes-all-s35-078.webp" alt="Inter-ORB Architecture" width="386" height="149" loading="lazy" decoding="async">
<figcaption>Inter-ORB Architecture</figcaption>
</figure>
<!-- /dcc-fig -->
`,
  slides: `
<h2>The teacher's slides for this unit</h2>
<p class="ref-intro">These are the pictures that came with this unit &mdash; the class deck, the reference notes and the pages handed out with them &mdash; collected here so that the notes above read as writing rather than as a pile of screenshots. Each group is headed by the section of the notes its pictures belong to, in that order, and names the file and the slides they came from. The diagrams the notes themselves need are drawn in the notes.</p>

<h3>The file service architecture</h3>

<p class="ref-meta">From <em>Chapter4_lecture_notes_all.pptx</em>, slide 7.</p>

<!-- dcc-fig:ch4/chapter4-lecture-notes-all-s07-071.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch4/chapter4-lecture-notes-all-s07-071.webp" alt="The Client module implements exported interfaces by flat file and directory services on server side" width="1092" height="501" loading="lazy" decoding="async">
<figcaption>The Client module implements exported interfaces by flat file and directory services on server side</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>SUN NFS — what it is</h3>

<p class="ref-meta">From <em>Chapter4_lecture_notes_all.pptx</em>, slide 15.</p>

<!-- dcc-fig:ch4/chapter4-lecture-notes-all-s15-072.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch4/chapter4-lecture-notes-all-s15-072.webp" alt="SUN NFS Architecture" width="1066" height="666" loading="lazy" decoding="async">
<figcaption>SUN NFS Architecture</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>NFS's design, and its three parts</h3>

<p class="ref-meta">From <em>Chapter4_lecture_notes_all.pptx</em>, slide 18.</p>

<!-- dcc-fig:ch4/chapter4-lecture-notes-all-s18-073.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch4/chapter4-lecture-notes-all-s18-073.webp" alt="Client side" width="846" height="461" loading="lazy" decoding="async">
<figcaption>Client side</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>HDFS — design and why it is shaped that way</h3>

<p class="ref-meta">From <em>GFS_HDFS_Lecture.pdf</em>, slides 4&ndash;5.</p>

<!-- dcc-fig:ch1/gfs-hdfs-lecture-p05.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/gfs-hdfs-lecture-p05.webp" alt="Illustration for HDFS — design and why it is shaped that way" width="1600" height="1236" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch1/gfs-hdfs-lecture-p04.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/gfs-hdfs-lecture-p04.webp" alt="Illustration for HDFS — design and why it is shaped that way" width="1600" height="1236" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>Blocks</h3>

<p class="ref-meta">From <em>GFS_HDFS_Lecture.pdf</em>, slides 12 and 38.</p>

<!-- dcc-fig:ch1/gfs-hdfs-lecture-p38.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/gfs-hdfs-lecture-p38.webp" alt="Illustration for Blocks" width="1600" height="1236" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch1/gfs-hdfs-lecture-p12.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/gfs-hdfs-lecture-p12.webp" alt="Illustration for Blocks" width="1600" height="1236" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>Namenodes and datanodes — the architecture</h3>

<p class="ref-meta">From <em>GFS_HDFS_Lecture.pdf</em>, slides 32 and 34.</p>

<!-- dcc-fig:ch1/gfs-hdfs-lecture-p32.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/gfs-hdfs-lecture-p32.webp" alt="Illustration for Namenodes and datanodes — the architecture" width="1600" height="1236" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch1/gfs-hdfs-lecture-p34.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/gfs-hdfs-lecture-p34.webp" alt="Illustration for Namenodes and datanodes — the architecture" width="1600" height="1236" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>Why the NameNode is a single point of failure, and the three remedies</h3>

<p class="ref-meta">From <em>GFS_HDFS_Lecture.pdf</em>, <em>HDFS_Note_4Std_lecture.pdf</em>, slides 4 and 23&ndash;24.</p>

<!-- dcc-fig:ch1/gfs-hdfs-lecture-p23.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/gfs-hdfs-lecture-p23.webp" alt="Illustration for Why the NameNode is a single point of failure, and the three remedies" width="1600" height="1236" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch1/gfs-hdfs-lecture-p24.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/gfs-hdfs-lecture-p24.webp" alt="Illustration for Why the NameNode is a single point of failure, and the three remedies" width="1600" height="1236" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch4/hdfs-note-4std-lecture-p04.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch4/hdfs-note-4std-lecture-p04.webp" alt="Page from the notes on Why the NameNode is a single point of failure, and the three rem" width="1241" height="1754" loading="lazy" decoding="async">
<figcaption>Page from the notes on Why the NameNode is a single point of failure, and the three rem</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>GFS, and how HDFS relates to it</h3>

<p class="ref-meta">From <em>GFS_HDFS_Lecture.pdf</em>, slides 2&ndash;3, 6&ndash;8, 10&ndash;11, 14&ndash;19, 21&ndash;22, 25, 27&ndash;29 and 31.</p>

<!-- dcc-fig:ch1/gfs-hdfs-lecture-p02.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/gfs-hdfs-lecture-p02.webp" alt="Illustration for GFS, and how HDFS relates to it" width="1600" height="1236" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch1/gfs-hdfs-lecture-p03.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/gfs-hdfs-lecture-p03.webp" alt="Illustration for GFS, and how HDFS relates to it" width="1600" height="1236" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch1/gfs-hdfs-lecture-p28.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/gfs-hdfs-lecture-p28.webp" alt="Illustration for GFS, and how HDFS relates to it" width="1600" height="1236" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch1/gfs-hdfs-lecture-p29.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/gfs-hdfs-lecture-p29.webp" alt="Illustration for GFS, and how HDFS relates to it" width="1600" height="1236" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch1/gfs-hdfs-lecture-p31.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/gfs-hdfs-lecture-p31.webp" alt="Illustration for GFS, and how HDFS relates to it" width="1600" height="1236" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch1/gfs-hdfs-lecture-p06.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/gfs-hdfs-lecture-p06.webp" alt="Illustration for GFS, and how HDFS relates to it" width="1600" height="1236" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch1/gfs-hdfs-lecture-p07.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/gfs-hdfs-lecture-p07.webp" alt="Illustration for GFS, and how HDFS relates to it" width="1600" height="1236" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch1/gfs-hdfs-lecture-p14.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/gfs-hdfs-lecture-p14.webp" alt="Illustration for GFS, and how HDFS relates to it" width="1600" height="1236" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch1/gfs-hdfs-lecture-p08.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/gfs-hdfs-lecture-p08.webp" alt="Illustration for GFS, and how HDFS relates to it" width="1600" height="1236" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch1/gfs-hdfs-lecture-p10.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/gfs-hdfs-lecture-p10.webp" alt="Illustration for GFS, and how HDFS relates to it" width="1600" height="1236" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch1/gfs-hdfs-lecture-p11.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/gfs-hdfs-lecture-p11.webp" alt="Illustration for GFS, and how HDFS relates to it" width="1600" height="1236" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch1/gfs-hdfs-lecture-p22.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/gfs-hdfs-lecture-p22.webp" alt="Illustration for GFS, and how HDFS relates to it" width="1600" height="1236" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch1/gfs-hdfs-lecture-p25.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/gfs-hdfs-lecture-p25.webp" alt="Illustration for GFS, and how HDFS relates to it" width="1600" height="1236" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch1/gfs-hdfs-lecture-p27.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/gfs-hdfs-lecture-p27.webp" alt="Illustration for GFS, and how HDFS relates to it" width="1600" height="1236" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch1/gfs-hdfs-lecture-p15.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/gfs-hdfs-lecture-p15.webp" alt="Illustration for GFS, and how HDFS relates to it" width="1600" height="1236" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch1/gfs-hdfs-lecture-p16.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/gfs-hdfs-lecture-p16.webp" alt="Illustration for GFS, and how HDFS relates to it" width="1600" height="1236" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch1/gfs-hdfs-lecture-p17.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/gfs-hdfs-lecture-p17.webp" alt="Illustration for GFS, and how HDFS relates to it" width="1600" height="1236" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch1/gfs-hdfs-lecture-p18.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/gfs-hdfs-lecture-p18.webp" alt="Illustration for GFS, and how HDFS relates to it" width="1600" height="1236" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch1/gfs-hdfs-lecture-p19.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/gfs-hdfs-lecture-p19.webp" alt="Illustration for GFS, and how HDFS relates to it" width="1600" height="1236" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch1/gfs-hdfs-lecture-p21.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/gfs-hdfs-lecture-p21.webp" alt="Illustration for GFS, and how HDFS relates to it" width="1600" height="1236" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>Heterogeneity, and why middleware exists</h3>

<p class="ref-meta">From <em>Chapter4_lecture_notes_all.pptx</em>, slide 23.</p>

<!-- dcc-fig:ch4/chapter4-lecture-notes-all-s23-074.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch4/chapter4-lecture-notes-all-s23-074.webp" alt="Middleware" width="366" height="239" loading="lazy" decoding="async">
<figcaption>Middleware</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>CORBA</h3>

<p class="ref-meta">From <em>Chapter4_lecture_notes_all.pptx</em>, slides 27&ndash;28 and 33.</p>

<!-- dcc-fig:ch4/chapter4-lecture-notes-all-s33-077.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch4/chapter4-lecture-notes-all-s33-077.webp" alt="The Object Request Broker (ORB)" width="360" height="314" loading="lazy" decoding="async">
<figcaption>The Object Request Broker (ORB)</figcaption>
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch4/chapter4-lecture-notes-all-s27-075.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch4/chapter4-lecture-notes-all-s27-075.webp" alt="CORBA" width="383" height="220" loading="lazy" decoding="async">
<figcaption>CORBA</figcaption>
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch4/chapter4-lecture-notes-all-s28-076.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch4/chapter4-lecture-notes-all-s28-076.webp" alt="Main components of CORBA Architecture" width="1066" height="331" loading="lazy" decoding="async">
<figcaption>Main components of CORBA Architecture</figcaption>
</figure>
<!-- /dcc-fig -->

<h3>Messaging middleware: MQTT and AMQP</h3>

<p class="ref-meta">From <em>Ch4_MessagingProtocol_MQTT_AMQP_For_Students.pdf</em>, slides 1&ndash;7.</p>

<!-- dcc-fig:ch4/ch4-messagingprotocol-mqtt-amqp-for-students-p01.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch4/ch4-messagingprotocol-mqtt-amqp-for-students-p01.webp" alt="Illustration for Messaging middleware: MQTT and AMQP" width="1600" height="2262" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch4/ch4-messagingprotocol-mqtt-amqp-for-students-p02.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch4/ch4-messagingprotocol-mqtt-amqp-for-students-p02.webp" alt="Illustration for Messaging middleware: MQTT and AMQP" width="1600" height="2262" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch4/ch4-messagingprotocol-mqtt-amqp-for-students-p03.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch4/ch4-messagingprotocol-mqtt-amqp-for-students-p03.webp" alt="Illustration for Messaging middleware: MQTT and AMQP" width="1600" height="2262" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch4/ch4-messagingprotocol-mqtt-amqp-for-students-p04.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch4/ch4-messagingprotocol-mqtt-amqp-for-students-p04.webp" alt="Illustration for Messaging middleware: MQTT and AMQP" width="1600" height="2262" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch4/ch4-messagingprotocol-mqtt-amqp-for-students-p05.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch4/ch4-messagingprotocol-mqtt-amqp-for-students-p05.webp" alt="Illustration for Messaging middleware: MQTT and AMQP" width="1600" height="2262" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch4/ch4-messagingprotocol-mqtt-amqp-for-students-p06.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch4/ch4-messagingprotocol-mqtt-amqp-for-students-p06.webp" alt="Illustration for Messaging middleware: MQTT and AMQP" width="1600" height="2262" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<!-- dcc-fig:ch4/ch4-messagingprotocol-mqtt-amqp-for-students-p07.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch4/ch4-messagingprotocol-mqtt-amqp-for-students-p07.webp" alt="Illustration for Messaging middleware: MQTT and AMQP" width="1600" height="2262" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->

<h3>Other pictures from this unit</h3>

<p class="ref-meta">From <em>Chapter4_lecture_notes_all.pptx</em>, slide 4.</p>

<!-- dcc-fig:ch4/chapter4-lecture-notes-all-s04-070.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch4/chapter4-lecture-notes-all-s04-070.webp" alt="The above figure provides an overview of types of storage systems, that work in a distributed environment" width="1136" height="642" loading="lazy" decoding="async">
<figcaption>The above figure provides an overview of types of storage systems, that work in a distributed environment</figcaption>
</figure>
<!-- /dcc-fig -->

<h2>Extra pages from the GFS/HDFS lecture, not on the syllabus</h2>
<p>These four pages of <em>GFS_HDFS_Lecture.pdf</em> describe <strong>MapReduce job execution</strong> &mdash; the JobTracker and TaskTracker daemons, how a Hadoop job is split into map and reduce tasks, a Yahoo! cluster from 2010, and YARN replacing the JobTracker's two roles. The syllabus's Unit 4.2 is <strong>NFS, HDFS</strong> and nothing else: MapReduce, YARN, JobTracker and TaskTracker appear nowhere in the printed sub-topics, and no question on the Model Question 2025 asks about them. They are separated out for the same reason as the protocol slides above &mdash; the HDFS pages of this same lecture, the NameNode and DataNode ones, are in Namenodes and datanodes, where they belong, and these are a different subject that the matcher had no home for.</p>
<!-- dcc-fig:ch1/gfs-hdfs-lecture-p33.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/gfs-hdfs-lecture-p33.webp" alt="Illustration from material outside the syllabus" width="1600" height="1236" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->
<!-- dcc-fig:ch1/gfs-hdfs-lecture-p35.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/gfs-hdfs-lecture-p35.webp" alt="Illustration from material outside the syllabus" width="1600" height="1236" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->
<!-- dcc-fig:ch1/gfs-hdfs-lecture-p36.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/gfs-hdfs-lecture-p36.webp" alt="Illustration from material outside the syllabus" width="1600" height="1236" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->
<!-- dcc-fig:ch1/gfs-hdfs-lecture-p37.webp -->
<figure class="figure-wrap">
<img class="figure wide slide" src="../assets/dcc-slides/ch1/gfs-hdfs-lecture-p37.webp" alt="Illustration from material outside the syllabus" width="1600" height="1236" loading="lazy" decoding="async">
</figure>
<!-- /dcc-fig -->
`,
  quiz: [
    {
      q: 'In the file service architecture, what is a UFID used for?',
      options: [
        'To encrypt a file before it crosses the network',
        'To refer to a file in all flat file service operations, uniquely among all files in the distributed system',
        'To identify which client has a file open',
        'To record the file\'s physical cylinder and sector'
      ],
      answer: 1,
      explanation: 'The flat file service is concerned with operations on file contents, and Unique File Identifiers are used to refer to files in all its requests. They are long sequences of bits chosen so that each file is unique among all the files in a distributed system. The directory service maps text names to UFIDs.'
    },
    {
      q: 'Which of the three DFS naming schemes is neither location transparent nor location independent?',
      options: [
        'Files named with a combination of host and local name',
        'Remote directories mounted to local directories',
        'A single global name structure spanning all files',
        'Naming by UFID alone'
      ],
      answer: 0,
      explanation: 'Host + local name guarantees uniqueness but names the location, so it is neither transparent nor independent, and the DFS is a loose collection of independent file systems. Mounted remote directories are location independent (SUN NFS), and a single global name structure is the strongest illusion of one system.'
    },
    {
      q: 'Why does a transparent naming mapping insert a file identifier between the name and the physical location?',
      options: [
        'To make file names shorter',
        'So that when the physical location changes, only the file identifier needs to be modified',
        'To allow files to be encrypted',
        'Because physical addresses cannot be stored in a directory'
      ],
      answer: 1,
      explanation: 'Non-transparent: name → <system, disk, cylinder, sector>. Transparent: name → file identifier → <system, disk, cylinder, sector>. The extra level is what makes relocation invisible, which is why the identifier must be unique.'
    },
    {
      q: 'What is the essential difference between a stateful and a stateless file service?',
      options: [
        'A stateful server is always faster in every respect',
        'A stateful server keeps information about client requests; a stateless server requires each request to be self-contained',
        'A stateless server cannot cache anything',
        'A stateful server cannot tolerate any client failure'
      ],
      answer: 1,
      explanation: 'A stateful server tracks open files, connection identifiers and caches, and must reclaim memory when a client closes a file or dies; performance is better because the filename need not be parsed each time. A stateless server has self-contained requests and remembers nothing, so it starts easily after a crash.'
    },
    {
      q: 'A SUN NFS file handle consists of:',
      options: [
        'A filename and a file offset',
        'A filesystem id, an i-node number and a generation number',
        'A host name, a port number and a password',
        'A UFID and a user id'
      ],
      answer: 1,
      explanation: 'The filesystem id identifies the disk partition, the i-node number identifies the file within the partition, and the generation number changes every time the i-node is reused — which is what prevents a stale handle from addressing a different file. The server keeps the filesystem id in the superblock and the generation number in the i-node.'
    },
    {
      q: 'Why must an NFS server check the user\'s identity and access rights on every request?',
      options: [
        'Because the protocol encrypts nothing',
        'Because it is a stateless server, so it holds no record of the client between calls',
        'Because UNIX permissions are checked by the client',
        'Because the server caches file blocks'
      ],
      answer: 1,
      explanation: 'Statelessness means there is no session to check at. So every client request is accompanied by the userID and groupID, inserted by the RPC system, and Kerberos has been integrated with NFS to give a stronger security solution. This also explains the requirement that uid and gid map identically on all machines.'
    },
    {
      q: 'Which is a stated issue with SUN NFS?',
      options: [
        'It requires a dedicated server on every network',
        'It has no file locking, and its UNIX semantics are not always preserved',
        'It cannot run on low-end machines',
        'It stores client state so recovery after a crash is slow'
      ],
      answer: 1,
      explanation: 'The issues are: root file systems cannot be shared; clients can mount the same subtree in different places, giving it different names; uid/gid mapping must be identical everywhere; there is no file locking; and an open file removed by another client is immediately deleted. NFS needs no dedicated server and is stateless, which is what gives it fast crash recovery.'
    },
    {
      q: 'In HDFS, which node holds the block-to-datanode mapping?',
      options: [
        'Each DataNode holds its own complete copy of the mapping',
        'The NameNode, in memory, along with the namespace and metadata',
        'The client caches it permanently',
        'The secondary namenode'
      ],
      answer: 1,
      explanation: 'The NameNode is the master: it manages the filesystem namespace, maintains the tree and the metadata for all files and directories, and knows which datanodes hold the blocks for a given file. Its persistent state on local disk is the namespace image and the edit log. Because the mapping is in memory, the number of files is limited by the NameNode\'s memory.'
    },
    {
      q: 'What is the main role of the secondary namenode in normal operation?',
      options: [
        'It serves client requests in parallel with the primary namenode',
        'It periodically merges the namespace image with the edit log so the edit log does not grow too large',
        'It stores copies of every block',
        'It replaces the failover controller'
      ],
      answer: 1,
      explanation: 'Despite its name it does not act as a namenode. Its main role is checkpointing — periodically merging the namespace image with the edit log — though it can be shaped to act as the primary namenode if needed. Genuine automatic failover is HDFS high availability, with an active-standby pair.'
    },
    {
      q: 'Why are HDFS blocks so large (64 MB, often 128 MB)?',
      options: [
        'To reduce the number of datanodes needed',
        'To minimise the cost of seeks, so transfer time dominates seek time',
        'Because the namenode cannot address smaller blocks',
        'To make replication unnecessary'
      ],
      answer: 1,
      explanation: 'With a seek time of about 10 ms and a transfer rate of 100 MB/s, making the block about 100 MB makes the seek 1% of the transfer time, so a multi-block file transfers at the disk transfer rate. The other benefits of the block abstraction are that a file can exceed one disk, storage management simplifies, and blocks suit replication.'
    },
    {
      q: 'How long can a cold start of a new NameNode take on a large cluster?',
      options: [
        'A few seconds',
        'About two minutes',
        '30 minutes or more',
        'It is instantaneous because metadata is in memory'
      ],
      answer: 2,
      explanation: 'The new namenode cannot serve requests until it has loaded its namespace image, replayed its edit log, and received enough block reports to leave safe mode — 30 minutes or more on large clusters. That delay is the motivation for HDFS high availability, where a standby namenode takes over without significant interruption.'
    },
    {
      q: 'In HDFS high availability, which architectural change is needed because block mappings live in memory?',
      options: [
        'Clients must send block reports',
        'Datanodes must send block reports to both namenodes',
        'The edit log must be kept on each datanode',
        'Blocks must be replicated twice instead of three times'
      ],
      answer: 1,
      explanation: 'Three changes are needed: the namenodes share the edit log via highly available shared storage; datanodes send block reports to both namenodes, since the mappings are in memory and not on disk; and clients must handle failover transparently. A failover controller — the first implementation using ZooKeeper — ensures only one namenode is active, and fencing prevents the old active node from causing corruption.'
    },
    {
      q: 'What does HDFS Federation add?',
      options: [
        'Automatic replication of the namenode',
        'Multiple namenodes, each managing a portion of the filesystem namespace, to scale past in-memory metadata limits',
        'A second copy of every block in a remote site',
        'A single global namespace shared by all namenodes'
      ],
      answer: 1,
      explanation: 'Federation (0.23 series) lets a cluster scale by adding namenodes — one managing /user, another /share, for example. Namespace volumes are independent, namenodes do not communicate, and one failing does not affect the others; but block pool storage is not partitioned, so datanodes register with every namenode.'
    },
    {
      q: 'In GFS, which statement about the master is correct?',
      options: [
        'All file data passes through the master for security',
        'Data does not flow across the master: the client asks for chunk locations and reads data from a chunkserver directly',
        'The master stores no metadata, only chunk data',
        'The master keeps a persistent record of chunk replica locations'
      ],
      answer: 1,
      explanation: 'The client translates the filename and offset into a chunk index, asks the master, receives the chunk handle and locations, caches that metadata, then talks to the closest replica directly for bytes. The master does not keep a persistent record of chunk replica locations — it polls chunkservers at startup and relies on heartbeats, so the chunkserver has the final word over what chunks it has.'
    },
    {
      q: 'Which is true of CORBA?',
      options: [
        'CORBA is a programming language for distributed objects',
        'CORBA is a specification published by the OMG; there are products that implement it to some extent',
        'CORBA is a product sold by OMG',
        'CORBA replaces the need for an IDL'
      ],
      answer: 1,
      explanation: 'OMG, a non-profit consortium formed in 1989, develops and promotes standards; CORBA is the specification of the Object Request Broker, detailing middleware functions that let objects communicate regardless of location, designer or language. OMG provides only the specification, and an IDL is central to it — proxies and skeletons are generated by compiling the IDL.'
    },
    {
      q: 'Which repository does a CORBA object adapter use to resolve an incoming call and activate the right object method?',
      options: [
        'The interface repository',
        'The implementation repository',
        'The naming service',
        'The transaction service'
      ],
      answer: 1,
      explanation: 'The implementation repository maps object adapter names to the pathnames of files containing object implementations, plus the hostname and port of the running server, and the object adapter uses it to activate the right method via a skeleton. The interface repository holds IDL interface descriptions and is what makes dynamic invocation possible.'
    },
    {
      q: 'In MQTT, what is the broker\'s role?',
      options: [
        'It publishes messages on behalf of devices',
        'It receives data from publishers and forwards it to the interested subscribers',
        'It stores all messages permanently',
        'It translates MQTT into HTTP'
      ],
      answer: 1,
      explanation: 'The broker sits between publishers (clients that send data to it) and subscribers (clients registered with it to receive updates from specific sources). The publisher never names a receiver and the subscriber never names a sender — the broker decouples them, which is what suits intermittent connectivity.'
    },
    {
      q: 'Which is a difference between MQTT and AMQP?',
      options: [
        'MQTT supports request-response only; AMQP supports publish-subscribe only',
        'MQTT is publish-subscribe over TCP for lightweight and unreliable networks; AMQP is a binary application-layer protocol focused on interoperability, supporting both publish-subscribe and request-response',
        'AMQP cannot use queues',
        'MQTT is used only in corporate environments'
      ],
      answer: 1,
      explanation: 'MQTT is the lightweight publish-subscribe protocol for IoT/M2M over TCP (MQTT-SN can use UDP or Bluetooth); its message format is a 1-byte control header plus a 1-to-4-byte length, an optional variable header and an optional payload. AMQP is the binary application-layer protocol generally used in corporate environments, focused on interoperability, with brokers and queues.'
    }
  ],

  past: [
    {
      year: 'Final 2025',
      marks: '4',
      repeats: 1,
      q: 'Define transparency in DFS and explain naming transparency.',
      occ: [
        { year: 'Final 2025', marks: '4', q: 'Define transparency in DFS and explain naming transparency.' }
      ],
      answer: `
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
separates a 4 from a 2. The same distinction is the naming section of these notes.</p>
</div>
`
    },
    {
      year: 'Final 2025',
      marks: '8',
      repeats: 1,
      q: 'Define Middleware. Explain the concepts related to CORBA with its architecture and services in detail.',
      occ: [
        { year: 'Final 2025', marks: '8', q: 'Define Middleware. Explain the concepts related to CORBA with its architecture and services in detail.' }
      ],
      answer: `
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
</div>
`
    },
    {
      year: 'Model 2025',
      marks: '4',
      repeats: 1,
      q: 'Describe the concept of consistency in Distributed File Systems (DFS).',
      occ: [
        { year: 'Model 2025', marks: '4', q: 'Describe the concept of consistency in Distributed File Systems (DFS).' }
      ],
      answer: `
<h4>Model answer &mdash; 4 marks</h4>
<p><strong>Definition.</strong> Consistency is the requirement that <strong>when a file is cached or replicated, every client that reads it observes the effects of updates according to a defined rule</strong>. It is one of the DFS design goals &mdash; alongside transparency, concurrency, replication, heterogeneity, fault tolerance, security and efficiency &mdash; and it exists as a problem because a DFS deliberately keeps <strong>more than one copy</strong> of data: replicas on servers for availability, and cached blocks on clients for performance. A write to one copy does not automatically reach the others, so consistency is the contract that says how soon and in what order it does.</p>

<p><strong>Why it is unavoidable.</strong> The client module of the file service architecture <strong>caches recently used file blocks</strong> to get acceptable performance, and the DFS comparison table records a cache consistency strategy for every system in it &mdash; NFS, Coda, Plan 9 and xFS use <strong>write-back</strong>, SFS writes through. Write-back is faster and leaves a window in which the cache is wrong. Replication adds the second source of copies: the naming mapping for a replicated file returns <strong>a set of locations for the replicas</strong>, so the rule must also say what happens when concurrent clients write to different copies.</p>

<p><strong>Strict consistency.</strong> Every read sees the most recent write immediately, everywhere. It requires writes to be propagated synchronously to every copy before the write completes and no client cache to be trusted, so its cost is latency on every write proportional to the number of copies. <strong>Read-one/write-all (ROWA)</strong> replication is the strict design in the DFS comparison table, used by Coda.</p>

<p><strong>Relaxed (weaker) consistency.</strong> A read may see an older version for a bounded, defined period or until a defined event occurs.</p>
<ul>
<li><strong>SUN NFS</strong> uses a <strong>close-to-open</strong> model: cached updates are <strong>not visible to other processes until the file is closed</strong>, at which point the client flushes them. Most installations operate with a <strong>consistency window of 30 seconds</strong> between client and server, which is how long a client may keep using cached data before revalidating it (Coulouris, <em>Distributed Systems: Concepts and Design</em>, Section 12.3 &mdash; the deck's own comparison table records NFS's cache consistency as write-back).</li>
<li><strong>GFS and HDFS</strong> are relaxed in a different way: files are <strong>write-once, read-many, with writes appended at the end</strong>, and no support for modification at arbitrary offsets &mdash; which removes most of the concurrent-update problem by construction.</li>
</ul>

<p><strong>Concluding point.</strong> A <strong>cache consistency protocol is what makes caching safe</strong>, and choosing it is choosing between the two rows above: write-back with revalidation, or write-through at the cost of performance. Consistency also interacts with the failure model &mdash; NFS is stateless, so a crashed server needs no recovery state, but a stateless server cannot remember that a client holds a file, which is one reason it has no file locking and does not perfectly preserve UNIX semantics.</p>

<div class="concept-box tip">
<h4>Where this came from</h4>
<p>Group B, question 9 of the <em>Model Question 2025</em>, worth 4 marks. Structure it as: definition &rarr; why caching and replication force it &rarr; strict vs relaxed with one named example each &rarr; the NFS number. The 30-second window is the detail that shows you read the textbook rather than only the slides.</p>
</div>`
    },
    {
      year: 'Model 2025',
      marks: '8',
      repeats: 1,
      q: 'Explain the architecture of HDFS. Discuss how it ensures fault tolerance and scalability. [4+4]',
      occ: [
        { year: 'Model 2025', marks: '8', q: 'Explain the architecture of HDFS. Discuss how it ensures fault tolerance and scalability. [4+4]' }
      ],
      answer: `
<h4>Model answer &mdash; 8 marks</h4>

<p><strong>Part 1 &mdash; Architecture (4 marks).</strong> HDFS is <strong>a distributed file system designed for storing very large files with streaming data access patterns, running on clusters of commodity hardware</strong>. It exists because <strong>when a dataset outgrows the storage capacity of a single machine it must be partitioned across several, and file systems that manage storage across a network of machines are distributed file systems</strong>. Its assumptions are <strong>very large files</strong> (hundreds of MB to TB or PB), <strong>streaming access</strong> under a write-once, read-many-times pattern, and <strong>commodity hardware</strong>, for which <strong>the chance of node failure across the cluster is high</strong> and in the face of which HDFS is designed to keep working without noticeable interruption.</p>

<p><strong>Blocks.</strong> Files are <strong>broken into block-sized chunks stored as independent units</strong>, <strong>64 MB by default (many installations use 128 MB)</strong>. The large size is to <strong>minimise the cost of seeks</strong>: with a 10 ms seek and 100 MB/s transfer, a block of about 100 MB makes the seek 1% of the transfer time, so multi-block files transfer at the disk rate. Blocks give three benefits: <strong>a file can be larger than any single disk</strong>, since blocks need not be co-located; <strong>the storage subsystem deals in blocks rather than files</strong>, simplifying management and eliminating metadata concerns; and <strong>blocks fit replication</strong>, since each block can be copied to a few physically separate machines.</p>

<p><strong>Master&ndash;worker nodes.</strong> An HDFS cluster has <strong>two types of node in a master&ndash;worker pattern</strong>:</p>
<ul>
<li><strong>NameNode (master)</strong> &mdash; manages the <strong>filesystem namespace</strong>, maintaining <strong>the filesystem tree and the metadata for all files and directories</strong>, persisted on local disk as <strong>the namespace image and the edit log</strong>. It also <strong>determines the mapping of blocks to DataNodes</strong> and regulates client access: opening, closing and renaming files and directories.</li>
<li><strong>DataNodes (slaves/workers)</strong> &mdash; the <strong>workhorses of the filesystem</strong>: they <strong>store and retrieve blocks when told to</strong> by clients or the NameNode, and <strong>report back periodically with lists of the blocks they are storing</strong>, performing <strong>block creation, deletion and replication on instruction from the NameNode</strong>.</li>
</ul>
<p><strong>The client asks the NameNode for metadata and then reads or writes block data directly to DataNodes</strong> &mdash; <strong>data does not flow through the NameNode</strong> (the same separation as GFS, where the client translates the filename and offset into a chunk index, the master replies with the chunk handle and locations, the client caches that metadata, and then requests bytes from the closest replica). The wider cluster follows the same shape: <strong>Master: NameNode, JobTracker; Slave: {DataNode, TaskTracker}</strong>.</p>

<p><strong>Part 2 &mdash; Fault tolerance and scalability (4 marks).</strong></p>
<p><em>Fault tolerance.</em> First, <strong>block replication</strong>: each block is replicated to a small number of <strong>physically separate machines, typically three</strong>, to insure against corrupted blocks and disk and machine failure. Second, the NameNode is <strong>a single point of failure</strong> &mdash; <strong>if it fails, all files would be lost, because there is no way of knowing how to reconstruct them from the blocks on the DataNodes</strong>, and all clients including MapReduce jobs could not read, write or list files. Three remedies:</p>
<ul>
<li><strong>Backup of the persistent metadata state</strong> &mdash; the NameNode can be configured to write its persistent state to <strong>multiple filesystems</strong>, with <strong>synchronous and atomic</strong> writes, usually <strong>local disk plus a remote NFS mount</strong>.</li>
<li><strong>The secondary namenode</strong> &mdash; despite its name it does not act as a namenode: it <strong>periodically merges the namespace image with the edit log so the edit log does not become too large</strong>, and can be shaped to act as the primary if needed.</li>
<li><strong>HDFS high availability</strong> (0.23) &mdash; <strong>a pair of namenodes in an active&ndash;standby configuration</strong>, where the standby <strong>takes over without significant interruption</strong>. This needs three changes: the namenodes <strong>share the edit log through highly available shared storage</strong>; <strong>DataNodes send block reports to both namenodes</strong>, because the mappings are in memory and not on disk; and <strong>clients handle failover transparently</strong>. A <strong>failover controller</strong> manages the transition &mdash; the first implementation uses <strong>ZooKeeper to ensure only one namenode is active</strong> &mdash; and may be <strong>graceful</strong> when an administrator triggers it for maintenance, or ungraceful, in which case <strong>fencing</strong> prevents the old active namenode from causing damage or corruption. Without HA, a cold start requires loading the namespace image, replaying the edit log and receiving block reports to leave safe mode, which can take <strong>30 minutes or more</strong>.</li>
</ul>

<p><em>Scalability.</em> The block abstraction lets <strong>a file be larger than any single disk</strong>, and the separation of metadata from data lets one master serve a very large cluster because <strong>data never flows through it</strong>. The limiting factor is that <strong>the NameNode keeps a reference to every file and block in memory</strong>, so memory governs how far a cluster can scale &mdash; and <strong>HDFS Federation (0.23) addresses this by allowing a cluster to scale by adding namenodes, each managing a portion of the filesystem namespace</strong> (one for <code>/user</code>, another for <code>/share</code>), with <strong>independent namespace volumes that do not communicate and whose failures do not affect each other</strong>, while <strong>block pool storage is not partitioned</strong> so DataNodes register with every namenode. Replication is also what makes scaling safe: adding commodity machines adds both capacity and the redundancy to lose some of them.</p>

<p><em>Also worth a line:</em> HDFS is deliberately <strong>not a good fit for low-latency access</strong> (tens of milliseconds), <strong>lots of small files</strong> (the number of files is governed by NameNode memory), or <strong>multiple writers and arbitrary file modifications</strong> (single writer, writes always at the end of the file).</p>

<div class="concept-box tip">
<h4>Where this came from</h4>
<p>Group C, question 16 of the <em>Model Question 2025</em>, marked <strong>[4+4]</strong> &mdash; two halves of 4 marks each. Answer it in two headed parts and draw Fig 4.2 for the architecture. The fault-tolerance half needs the four mechanisms by name: three-way block replication, multi-filesystem backup of the NameNode state, the secondary namenode, and high availability with shared edit log, dual block reports, ZooKeeper-based failover control and fencing. The scalability half is federation plus the in-memory metadata limit.</p>
</div>`
    }
  ]
};
