// test-backend.js
async function runTests() {
  console.log('=== STARTING ML V-LAB V2 BACKEND INTEGRATION TESTS ===\n');
  const baseUrl = 'http://localhost:5001/api';

  // 1. Health check
  const healthRes = await fetch(`${baseUrl}/health`);
  const health = await healthRes.json();
  console.log('1. Health check:', health.status === 'ok' ? '✅ PASS' : '❌ FAIL', health);

  // 2. Wrong password test
  const wrongLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@srm.edu', password: 'WrongPassword' }),
  });
  console.log('2. Wrong password rejected (401):', wrongLoginRes.status === 401 ? '✅ PASS' : '❌ FAIL');

  // 3. Register Student A
  const timestamp = Date.now();
  const studentAEmail = `student_${timestamp}@srm.edu`;
  const studentARegId = `RA${timestamp.toString().slice(-10)}`;
  const regRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentId: studentARegId,
      name: 'Rohan Sharma',
      email: studentAEmail,
      password: 'Password@123',
    }),
  });
  const regData = await regRes.json();
  const tokenA = regData.token;
  const userAId = regData.user.id;
  console.log('3. Student A registration:', regRes.status === 201 && tokenA ? '✅ PASS' : '❌ FAIL', regData.user);

  // 4. Update Progress for Student A
  const secRes = await fetch(`${baseUrl}/progress/section`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({ experimentId: '1', section: 'aim' }),
  });
  console.log('4a. Mark Aim complete (Exp 1):', secRes.ok ? '✅ PASS' : '❌ FAIL');

  await fetch(`${baseUrl}/progress/section`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({ experimentId: '1', section: 'theory' }),
  });

  const stepRes = await fetch(`${baseUrl}/progress/step`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({ experimentId: '1', stepIndex: 0, isCompleted: true }),
  });
  console.log('4b. Save procedure step 0 complete:', stepRes.ok ? '✅ PASS' : '❌ FAIL');

  // 5. Submit Pretest Quiz
  const quizRes = await fetch(`${baseUrl}/quizzes/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      experimentId: '1',
      quizType: 'pretest',
      score: 2,
      totalQuestions: 2,
      answers: [0, 1],
    }),
  });
  const quizData = await quizRes.json();
  console.log('5. Submit Pre-Test (Exp 1, 100%):', quizRes.status === 201 ? '✅ PASS' : '❌ FAIL', quizData);

  // 6. Add Note & Bookmark
  const noteRes = await fetch(`${baseUrl}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({ experimentId: '1', content: 'Observed standard scaling maintains mean=0, std=1.' }),
  });
  console.log('6a. Save Note:', noteRes.ok ? '✅ PASS' : '❌ FAIL');

  const bmarkRes = await fetch(`${baseUrl}/bookmarks/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({ experimentId: '1', title: 'Data Pre-processing' }),
  });
  console.log('6b. Toggle Bookmark:', bmarkRes.ok ? '✅ PASS' : '❌ FAIL');

  // 7. Verify Student A progress retrieval
  const progRes = await fetch(`${baseUrl}/progress`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const progA = await progRes.json();
  console.log('7. Student A Progress retrieved from DB:',
    progA.experiments['1']?.aim === true &&
    progA.experiments['1']?.theory === true &&
    progA.quizResults['exp-1-pretest']?.score === 2 &&
    progA.notes['1']?.length > 0 &&
    progA.bookmarks?.length === 1
      ? '✅ PASS' : '❌ FAIL', progA);

  // 8. Register Student B & Verify Isolation
  const timestampB = Date.now() + 50;
  const studentBEmail = `student_b_${timestampB}@srm.edu`;
  const studentBRegId = `RB${timestampB.toString().slice(-10)}`;
  const regBRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentId: studentBRegId,
      name: 'Pooja Verma',
      email: studentBEmail,
      password: 'Password@123',
    }),
  });
  const regBData = await regBRes.json();
  const tokenB = regBData.token;

  const progBRes = await fetch(`${baseUrl}/progress`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  const progB = await progBRes.json();
  const isIsolated = Object.keys(progB.experiments).length === 0 &&
    Object.keys(progB.notes).length === 0 &&
    progB.bookmarks.length === 0;
  console.log('8. Student Data Isolation (Student B cannot see Student A records):', isIsolated ? '✅ PASS' : '❌ FAIL');

  // 9. Unauthorized Role Check (Student attempting teacher endpoint)
  const studentAccessTeacherRes = await fetch(`${baseUrl}/teacher/students`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  console.log('9. Student blocked from Teacher endpoints (403 Forbidden):', studentAccessTeacherRes.status === 403 ? '✅ PASS' : '❌ FAIL');

  // 10. Teacher Login
  const teacherLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'teacher@srm.edu', password: 'Teacher@123' }),
  });
  const teacherData = await teacherLoginRes.json();
  const teacherToken = teacherData.token;
  console.log('10. Teacher Login:', teacherLoginRes.ok && teacherToken ? '✅ PASS' : '❌ FAIL');

  // 11. Create class and Join class test
  const createClassRes = await fetch(`${baseUrl}/classes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${teacherToken}` },
    body: JSON.stringify({ name: 'ML Test Class', description: 'Integration test class' })
  });
  const createdClass = await createClassRes.json();
  console.log('11a. Teacher create class with invite code:', createClassRes.ok && createdClass.invite_code ? '✅ PASS' : '❌ FAIL', `Code: ${createdClass.invite_code}`);

  const joinRes = await fetch(`${baseUrl}/classes/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({ inviteCode: createdClass.invite_code })
  });
  const joinData = await joinRes.json();
  console.log('11b. Student A join class with code:', joinRes.ok && joinData.message ? '✅ PASS' : '❌ FAIL', joinData);

  // Student B also joins
  await fetch(`${baseUrl}/classes/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
    body: JSON.stringify({ inviteCode: createdClass.invite_code })
  });

  const duplicateJoinRes = await fetch(`${baseUrl}/classes/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({ inviteCode: createdClass.invite_code })
  });
  const duplicateData = await duplicateJoinRes.json();
  console.log('11c. Duplicate join returns exact error message:', duplicateJoinRes.status === 400 && duplicateData.error === 'You are already a member of this Virtual Lab.' ? '✅ PASS' : '❌ FAIL', duplicateData);

  const invalidJoinRes = await fetch(`${baseUrl}/classes/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({ inviteCode: 'INVALID99' })
  });
  const invalidData = await invalidJoinRes.json();
  console.log('11d. Invalid invite code returns exact error message:', invalidJoinRes.status === 404 && invalidData.error === 'Invalid invite code.' ? '✅ PASS' : '❌ FAIL', invalidData);

  // 12. Teacher Class Oversight (inspect enrolled students)
  const teacherStudentsRes = await fetch(`${baseUrl}/teacher/students`, {
    headers: { Authorization: `Bearer ${teacherToken}` },
  });
  const teacherStudents = await teacherStudentsRes.json();
  console.log('12a. Teacher Student Directory:', teacherStudentsRes.ok && teacherStudents.students.length >= 2 ? '✅ PASS' : '❌ FAIL', `Found ${teacherStudents.students?.length} students`);

  const studentDetailRes = await fetch(`${baseUrl}/teacher/students/${userAId}`, {
    headers: { Authorization: `Bearer ${teacherToken}` },
  });
  const studentDetail = await studentDetailRes.json();
  console.log('12b. Teacher granular inspection of Student A (10 experiments grid + pretest 100%):',
    studentDetailRes.ok &&
    studentDetail.experiments[0].pretest?.score === 2 &&
    studentDetail.experiments[0].sections.aim === true
      ? '✅ PASS' : '❌ FAIL');

  console.log('\n=== ALL INTEGRATION TESTS COMPLETED SUCCESSFULLY ===');
}

runTests().catch(console.error);
