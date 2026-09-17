/* What course this is.

   The shell — engine.js, app.js, modules/*, assets/css/* — is shared with the
   Simulation & Modeling portal and reads everything that differs between the
   two courses from here. It has to be defined before engine.js runs, which is
   why this file is the first script on the page.

   Every number below is from the syllabus PDF, not from memory:

     `m`      the "Tentative Marks Distribution" table on page 3, which the
              marks add up to 60 in
     `h`      the hours in brackets after each unit heading, which add to 45
              scheduled hours (L 3 / T 1 / P 2 per week)
     `tabs`   the mock exam is deliberately absent: this course is one paper
              old, so there is no bank to build a weighted 60-mark paper from
              yet. `engine.js` refuses #/exam when 'exam' is not in this list
              rather than routing to a panel that does not exist. */

window.COURSE = {
  id: 'dcc',
  code: 'BCE7024',
  title: 'Distributed & Cloud Computing',
  semester: 'Sem VII',

  /* Chapter marks, in chapter order. The sum is the paper total — engine.js
     adds them rather than taking a separate literal, so the header, the score
     and the breakdown cannot drift apart. */
  examWeights: [6, 10, 6, 6, 6, 8, 6, 8, 4],
  chapterCount: 9,
  /* `teach` is the fourth way into the same syllabus and the longest of them: every
     sub-topic taught end to end - what it is, why it works that way, how it runs,
     where marks are lost, and the shape of a full-marks answer (data/dcc_teach.json,
     guarded by tools/teach_notes.py). Learn is the notes as taught in class, Revise
     is a fixed ~120 words per sub-topic for the night before, and this is the layer
     in between: no length limit, written to be learned from rather than skimmed.
     Each topic leads with a SUMMARY CARD - the definition, the points that have to
     be stated, the run-through, the traps and the answer skeleton - and keeps the
     written teaching one click below it, so the tab is read as a summary and
     studied as a lesson.

     `revise` is the byte-size revision tab and it sits second, beside Learn: one
     fixed-size card per syllabus sub-topic (data/dcc_rev.json, guarded by
     tools/rev_summaries.py). Learn is where the depth is, Revise is what is read
     when the exam is closer than the understanding, so it is one click from the
     reading rather than a mode inside it.

     `reference` is the teacher's circled-i slides - his sign for material that is
     for reference rather than for the paper. They are kept out of the notes and
     collected on this tab (tools/make_reference.py). */
  tabs: ['learn', 'teach', 'revise', 'quiz', 'past', 'reference', 'analysis'],

  /* `t` is what the sidebar and the breadcrumb show, so it is kept short
     enough to sit on one line in a 240px rail. `m` is the marks badge. */
  meta: [
    { n: 1, t: 'Introduction to Distributed Systems', m: 6,  h: 4 },
    { n: 2, t: 'Communication in Distributed Systems', m: 10, h: 7 },
    { n: 3, t: 'Synchronization and Coordination',    m: 6,  h: 5 },
    { n: 4, t: 'Distributed File Systems',            m: 6,  h: 5 },
    { n: 5, t: 'Introduction to Cloud Computing',     m: 6,  h: 4 },
    { n: 6, t: 'Virtualization and Cloud Architecture', m: 8, h: 6 },
    { n: 7, t: 'Cloud Platforms and Technologies',    m: 6,  h: 4 },
    { n: 8, t: 'Security and Challenges in Cloud',    m: 8,  h: 6 },
    { n: 9, t: 'Emerging Trends',                    m: 4,  h: 4 }
  ]
};
