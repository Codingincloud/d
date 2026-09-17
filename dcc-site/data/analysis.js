/* Analysis data for the DCC portal.

   Unlike the Simulation portal's `data/analysis.js`, this is not generated from
   a question bank — there is no bank yet. It is hand-derived from the two
   documents the course itself supplies, and every number in it can be checked
   against them:

     syllabus_distbd_cloudcomptng.txt  page 3  the marks table (6,10,6,6,6,8,6,8,4 = 60)
     syllabus_distbd_cloudcomptng.txt  page 4  Model Question 2025, Group A and B
     syllabus_distbd_cloudcomptng.txt  page 5  Model Question 2025, Group C

   The per-unit question counts below are a real count of the sixteen questions
   in the model paper, sorted by which unit each one examines. app.js only draws
   the blocks it finds here, so the sections that need a real bank (most repeated
   topics, year-wise distribution) are absent rather than empty. */

window.ANALYSIS = {
  papers: ['Model 2025'],
  total_questions: 16,

  /* weight  = the unit's marks in the syllabus table
     questions = how many of the model paper's 16 questions examine this unit */
  chapters: {
    1: { title: 'Introduction to Distributed Systems',  weight: 6,  questions: 3 },
    2: { title: 'Communication in Distributed Systems', weight: 10, questions: 1 },
    3: { title: 'Synchronization and Coordination',     weight: 6,  questions: 3 },
    4: { title: 'Distributed File Systems',             weight: 6,  questions: 2 },
    5: { title: 'Introduction to Cloud Computing',      weight: 6,  questions: 3 },
    6: { title: 'Virtualization and Cloud Architecture', weight: 8, questions: 2 },
    7: { title: 'Cloud Platforms and Technologies',     weight: 6,  questions: 0 },
    8: { title: 'Security and Challenges in Cloud',     weight: 8,  questions: 1 },
    9: { title: 'Emerging Trends',                      weight: 4,  questions: 1 }
  },

  strategy: [
    {
      heading: 'The paper is 60 marks in three groups, and the arithmetic is worth knowing',
      items: [
        'Group A — four very short questions, 2 marks each, 8 marks total. The paper prints "2*4=8", so each is worth 2.',
        'Group B — eight short questions, answer any seven, 4 marks each. The paper does not print the per-question marks; they follow from the total: 8 + 7x + 3(8) = 60 gives x = 4.',
        'Group C — four long questions, answer any three, 8 marks each. Two of them print "[4+4]" explicitly, and 8 is the only value consistent with the total above.',
        'Group C alone is 24 of the 60 marks — 40% of the paper in three answers. Do not plan to run out of time before it.'
      ]
    },
    {
      heading: 'What the model paper actually asked, unit by unit',
      items: [
        'Unit 5 (Cloud Computing) and Unit 3 (Synchronization) each produced 3 of the 16 questions and Unit 1 produced 3 — between them 9 of 16.',
        'Unit 2 carries the single largest weight in the syllabus (10 marks) but produced only one question in the model paper, an RPC question in Group B. Expect more in the final.',
        'Unit 7 (AWS / Azure / GCP) carries 6 marks in the syllabus table and produced no question at all in the model paper. That is the gap to watch: either it is examined in the final, or those 6 marks move elsewhere.',
        'Unit 4 appeared twice, both in the long group — consistency in DFS (Group B) and HDFS architecture (Group C, [4+4]). HDFS is a repeating theme: it is also the example named in sub-topic 1.3.'
      ]
    },
    {
      heading: 'Choosing what to answer',
      items: [
        'Group B gives you a choice of 7 from 8, so you can drop one — but only if you know which one before you see the paper, which means covering every unit at least to note level.',
        'Group C gives 3 from 4. Because each is 8 marks, a weak Group C costs far more than a weak Group B: one missed Group B question is 4 marks, one missed Group C question is 8.',
        'The unit with the best marks-per-teaching-hour is Unit 1: 6 marks from 4 hours. The worst is Unit 3 looking at hours (6 marks from 5 hours) — but Unit 3 produced three model-paper questions, so it is worth more than its weight suggests.'
      ]
    },
    {
      heading: 'How these notes are sourced',
      items: [
        'Every unit\'s notes are written from that unit\'s own uploaded lecture material, read into text under _source/dcc/ by tools/dcc_extract.py.',
        'The slides are the primary source because they are what the class was taught from and the examiner teaches the course — the recommended books are for depth where a slide is a bare heading.',
        'Where a fact comes from a textbook rather than the slides, the note says which book and which chapter, so a claim can always be traced.'
      ]
    }
  ]
};
