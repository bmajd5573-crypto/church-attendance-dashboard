"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  createMember,
  fetchMembers,
  getAttendanceSummary,
  parseMemberText,
  sampleMembers,
  saveMembers,
  searchMembers,
  stageOptions,
  upsertAttendance,
  type Member,
  type MemberInput,
} from "./lib/attendance";

const adminAuthStorageKey = "church-attendance-admin-v1";
const today = new Date().toISOString().slice(0, 10);

type MemberWithCounts = Member & {
  attendedCount: number;
  absentCount: number;
  todayStatus: string;
};

const seededImportText = `1	لوسيا ذكريا جاد بباوي			kg
2	ايناس منير مهني سليمان			kgامينه فصل
3	بسنت حنا خليل حنا			kg
4	جيرمين عاطف حبيب عطالله			kg
5	حنان جرجس شكري جرجس			امينه خدمة
6	دلال باسم يوسف 			kg
7	دميانة عيد حكيم عبد المسيح 			kg
8	حنان عبد الملك عبد الملك 			kg
9	سارة سعيد سعد 			kg
10	سالي مجدي مقار 			kg
11	سامية ناجي جاد ميخائيل			kg
12	سليفيا رافت انيس عوض الله			امينة بيبي كلاس
13	سيلفيا جرجس راغب جرجس 			kg
14	سيمون مجدي متري عوض			kgامينه فصل
15	شادية منصور يوسف 			kg
16	صفاء سليمان عبد الملك غالي			kg
17	عبير طلعت ثابت جرجس 			kg
18	فيولا عصمت فرج 			kg
19	كرستينا نادي هنري تادرس			kg
20	ماري جرجس عطا الله منصور			kg
21	ماري عيد نصيف عوض الله			امينه فصل
22	ماريا رمسيس خليل حنا			kg
23	ماريان رمسيس بباوي جرجس			kg
24	ماريان صابر صالح اسطفانوس			kg
25	مارينا نجيب كامل خليل 			kg
26	مرفت ميلاد يعقوب 			kg
27	مريم سمير كامل خليل 			kg
28	مريهان جميل عبده بشاي			kg
29	مونيكا مدحت حكيم			kg
30	ميرنا نبيل حبيب ونيس			kg
31	ميرنا هاني غطاس عطالله 			kg
32	مينا جرجس حكيم مسيحة			kg
33	ناهد جرجس عطاالله منصور			امينه خدمه حضانة
34	نجوي إبراهيم  لبيب إبراهيم  			kg
35	نرمين حناوي بطرس حناوي			kg
36	نيفين حمدي ثابت برسوم			kg
37	نيفين مسعد عبد الشهيد سوريال			kg
38	هبة عطا ملاك وهبة			امينه فصل
39	هناء نعيم غبريال ميخائيل 			kg
40	ايريني عزت			kg
41	مونيكا جورج			kg
42	نرمين عزت ابو سته معوض			kg
43	ماريان عادل كندس عبدربه			kg
44	مارلين كمال			kg
45	يوستينا بشاي			kg
46	ت رشا عامر حنا غبريال 			kg
47	 مريم رسمي 			kg
48	استير ماهر اديب 			1و2
49	امال عبد التواب ميخائيل رزق 			1و2
50	جاكلين منصور ايوب منصور 			1و2
51	دينا صفوت وديع			1و2
52	دينا غطاس بديع فهيم			1و2
53	جيهان سامي رياض منصور 			1و2
54	رنا سامي رزق شنودة			1و2
55	سناء شحاته عزيز تادرس 			1و2
56	فيرينا مدحت ناثان فلتس 			1و2
57	كرستين مكرم ناثان عزب			1و2
58	لوسيا ذكريا جاد بباوي			1و2
59	مادونا سمير عدلي شكري			1و2
60	مادونا لطفي رمزي ويصا			1و2
61	ماريان جرجس عطالله منصور 			1و2
62	ماريان غطاس بديع فهيم			1و2
63	ماريان ماهر شبيب مكاري			1و2
64	مارينا عادل يوسف بطرس			1و2
65	مريم جاد الرب حبشي بقطر			1و2
66	مريم ناصر عزيز يوسف			1و2
67	مينا لويز فايز صالح			1و2
68	نرمين سمير عبده 			1و2
69	نهال مكرم فهمي إبراهيم			1و2
70	نيفين عامر حنا غبريال			1و2
71	هناء بشري شحاتة جنيدي			1و2
72	ولاء عادل معوض منصور			1و2
73	ميرنا  جمال			1و2
74	مريم مراد			1و2
75	كرستين عيد			1و2
76	 ميرا  هنرى ميشيل			1و2
77	كيرلس نبيل عبد الملاك			1و2
78	مارينا بخيت 			1و2
79	مارينا رضا 			1و2
80	تريزا وجية روفائيل 			1و2
81	ماري جرجس نادي			1و2
82	بيتر وديع لبيب			امين مرحلة 3
83	سلوى فرج زكريا			3
84	أندرو عياد			3
85	سيلفانا رضا عبد الله			3
86	هناء خلف وهبة			3
87	ريهام سليمان عبد الملاك			3
88	مونيكا وسام ويلسن			3
89	مريانه عادل جرس			3
90	جينا هنري ميشيل			3
91	هيلانة لطفي بشري			3
92	مادونا ناصر عزيز			3
93	استير نبيل فايز			3
94	فيفيان صفوت وديع			3
95	كرستين صفوت نصيف			3
96	مريم صفوت نصيف			3
97	مريم عطية القس مقار			3
98	أميرة فرج ذكي			3
99	فيفيان فرج سعد			4
100	جوني نادي هنري			4
101	كاراس القس يعقوب			4
102	مارسيل مجدي لمعي			4
103	نيفين جرجس فهيم			4
104	روماني حنا صادق			4
105	مريم زكريا جاد			4
106	مارينا طايع			4
107	ماري حلمي عطالله			4
108	ريهام ماهر انور			4
109	ايريني ادوارد فوزي			4
110	سامية وهبة برسوم			4
111	مريم عزت رويان			4
112	كرستين ميلاد شايب			4
113	بسمة كرم كامل			4
114	ماريز ميخائيل بطرس			4
115	مريم سمير ذكي			4
116	ليزا ادوار			4
117	مارسيل ابراهيم			4
118	سميرة ملاك ونيس			6  امينه المرحله بنات
119	امال بشاي عويضة شنودة			6 بنات
120	مريم ابراهيم جبران			6 بنات
121	ايزيس لويس ذكري			6 بنات
122	حنان نصحي خميس بخيت			6 بنات
123	كرستين امين فرج			6 بنات
124	داليا ابراهيم فوزي			6 بنات
125	شرين حنا خليل			6 بنات
126	ماريان عوض مسعد شحاتة			6 بنات
127	ساندي عادل عبدالمسيح 			6 بنات
128	مريم ادوارد نجيب			6 بنات
129	فيرينا وسام ولسن			6 بنات
130	سارة كرم كامل متري			6 بنات
131	ايمان ناجي جاد			5 بنات
132	رانيا نادي فارس عزيز			5 بنات
133	جيهان جورج فؤاد نصر			6 بنات
134	حنان سليمان فانوس			5 بنات
135	رحمه يوسف ابراهيم			5 بنات
136	مارينا ممدوح			5 بنات
137	ريموندا ايمن عبده			5 بنات
138	جورج لطفي ذكي عزيز			5بنين
139	وسيم عادل لبيب			6بنين
140	شوقي مرقس شوقي			6 بنين
141	بيتر رأفت انيس عوض الل			5 بنين
142	بافلي القس شنوده رمسيس			5 بنين
143	مارك سميرعدلي			6 بنين
144	ابانوب اسحق موسي سعد			6 بنين
145	مارينا سامي			6بنات
146	مارينا عزت			6بنات
147	مريم رضا			5بنات
148	مينا مجدي			5بنين
149	مينا ادوار			6 بنين
150	مايكل ممدوح			5بنين
151	عبير عبدالله فهيم داود نوار			بنات 6
152	بيشوي القمص سوريال 			بنين5
153	بيتر ماجد فوزي 			بنين6
154	نرجس عياد			بنات5
155	ريمون نسيم وهبه			1 اعدادي
156	بولا ادوار يواقيم			1 اعدادي
157	مينا ماجد ملك			1 اعدادي
158	انطونيوس نبيل وديد			1 اعدادي
159	مينا رمسيس بباوى			1 اعدادي
160	مسعد مجدى مسعد 			1 اعدادي
161	جورج سعد سامى			1 اعدادي
162	دميترى انور مترى			1 اعدادي
163	مينا ابراهيم فوزى			1 اعدادي
164	مينا عدلى جرجس			1 اعدادي
165	مينا هناء اديب			2اعدادي
166	مدحت حكيم شرقاوى			2اعدادي
167	رامز مجدى فوزى			2اعدادي
168	مارك لويز فايز			2اعدادي
169	مايكل شوقى جرجس			2اعدادي
170	مايكل وائل جاد			2اعدادي
171	بيتر ادوارد كمال			2اعدادي
172	ماركو جرجس حكيم			2اعدادي
173	انطوان هنرى ميشيل			2اعدادي
174	ابانوب صبرى عطية			2اعدادي
175	شريف مكرم نان			3 اعدادي
176	ايمن انيس خليل			3 اعدادي
177	كيرلس زكريا جاد			3 اعدادي
178	جورج عماد عياد			3 اعدادي
179	مينا ايمن ايميل			3 اعدادي
180	ماجد جورج مجلع			3 اعدادي
181	بيشوى موريس عزيز			3 اعدادي
182	بيتر عاطف عطالله			3 اعدادي
183	جوزيف رمزى يوحنا			3 اعدادي
184	ماهر جرجس عطالله			3 اعدادي
185	مايكل ميلاد شبيب			امين خدمه  اعدادي
186	داليا سمير			امين خدمه اعدادي
187	كرستينا چورچ مجلع			اعدادي
188	أمال برسوم ميخائيل			اعدادي
189	ليديا بولس مفيد			اعدادي
190	سيمون رمزي أمين			اعدادي
191	نيفين اسحق ظريف			اعدادي
192	نرمين فايز فايق			اعدادي
193	سماح زكريا وهبه			اعدادي
194	إيريني زيادة سيدهم			اعدادي
195	حنان رضا جاب الله			اعدادي
196	فيبي عماد عياد			اعدادي
197	نجلاء خلف حكيم			اعدادي
198	راندا عصمت صادق			اعدادي
199	مريم حنا اسحق			اعدادي
200	مارينا نيسان كامل			اعدادي
201	كارولين وسيم أنور			اعدادي
202	مريم يوسف إبراهيم			اعدادي
203	ريموندا شحات جاب الله			اعدادي
204	مريم عبده صموئيل			اعدادي
205	ميرفت معوض عبدالله			اعدادي
206	ماريان منصور عزيز			اعدادي
207	حنان صبحي رمزي			اعدادي
208	نيفين منير بشري			اعدادي
209	ليديا ماهر رمزي			اعدادي
210	أمل فايز عوض			اعدادي
211	سعدية رياض موسي			اعدادي
212	ماجي حشمت نص			اعدادي
213	رشا نبيل شحاتة			اعدادي
214	كرستينا القس يعقوب جرجس			اعدادي
215	سهام صبري معوض			اعدادي
216	أمل رأفت بربري			اعدادي
217	هيلانه لطفي بشري			اعدادي
218	فيفيان ولسن صديق			اعدادي
219	مريم صالح جرجس			اعدادي
220	كرستينا ثروت فوزي			اعدادي
221	حنان جمال ألفي			اعدادي
222	إنچي سمير رمزي			اعدادي
223	مونيكا طلعت عطالله			اعدادي
224	كاترين القس يعقوب جرجس			اعدادي
225	أماني سيف ثابت			اعدادي
226	مارينا باسم نعيم			اعدادي
227	إيفا كرم راشد			اعدادي
228	سهام نادي توفيق			اعدادي
229	مارجريت صبحي سلامه 			اعدادي
230	مريم عبد الملاك بشارة			اعدادي
231	حنان كريم فؤاد			اعدادي
232				
233	ماريز فكرى إلياس			اولي ثانوي
234	ألفت خلف ذكى			اولي ثانوي
235	امل اميل امين شحاتة			اولي ثانوي
236	ايريني ادوارد فوزي بطرس 			اولي ثانوي
237	تريزا موسى سعيد			اولي ثانوي
238	سالي جمال رفعت صليب			اولي ثانوي
239	ليلي يونان صادق			اولي ثانوي
240	ماري نبيل فايز			اولي ثانوي
241	مارينا ثروت هنرى تادرس			تانية ثانوي
242	مرثا يوسف إبراهيم			امينه اولي ثانوي
243	مريم بشري فيليب يوسف			اولي ثانوي
244	جانيت صبحي شحاته			اولي ثانوي
245	كريستين هناء أديب			تانية ثانوي
246	أمل فريد داود			تانية ثانوي
247	ايميلى شوقى رزق الله			تالتة ثانوي
248	جانيت يونان صادق			تانية ثانوي
249	كريستين وسيم أنور 			تانية ثانوي
250	مارتينا صالح عبد العزيز عبده			تانية ثانوي
251	مارجريت فايز ملك			تانية ثانوي
252	مارلين كمال بحيرة			تانية ثانوي
253	مارينا الامير حكيم			تانية ثانوي
254	مارينا عزت			تانية ثانوي
255	مارينا مكرم مرجان عزب			تانية ثانوي
256	نيرمين كمال محروس			تانية ثانوي
257	يوستينا وليم عبد الملاك			تانية ثانوي
258	ايناس سيف ثابت 			تالته ثانوي
259	ايفيلين وليم جرجس			تالته ثانوي
260	جاكلين معوض سعد			تالته ثانوي
261	ديانا ميلاد غبريال			تالته ثانوي
262	ريموندا روماني فرج			تالته ثانوي
263	عايدة سامي			تالته ثانوي
264	كريستين بولس مفيد			تالته ثانوي
265	كريستين ناصف رزق			تالته ثانوي
266	مادونا مقبل الفى			تالته ثانوي
267	ماريان القس تيموثاوس عبد النور 			امينة ثانوي
268	ميرفت عزيز بخيت			تالته ثانوي
269	نجوي اسحق موسى 			تالته ثانوي
270	نيرمين مجدي لبيب			تالته ثانوي
271	منى منير			تالته ثانوي
272	جوزيف مجدى 			اولي ثانوي
273	مينا ممدوح ناجي			اولي ثانوي
274	روماني رشدي ثابت			اولي ثانوي
275	مينا مجدي منير			اولي ثانوي
276	أسامة جمال الفي			اولي ثانوي
277	رامى فخرى فايق			اولي ثانوي
278	سامى رمزى يوحنا 			اولي ثانوي
279	بيتر سعد أنيس			تانيه ثانوي
280	كيرلس سعد محروس			تانيه ثانوي
281	ايهاب رمزي يوحنا			تانيه ثانوي
282	بيشوي زكي حلمي			تانيه ثانوي
283	أشرف أنور متري			تانيه ثانوي
284	هاني اسحق رمزي			تانيه ثانوي
285	أندرو ألفريد استيفانوس			تانيه ثانوي
286	جورج جميل صبحي			تانيه ثانوي
287	جون وجيه صليب			تانيه ثانوي
288	بيتر ميشيل ابراهيم			تالته ثانوي
289	انطونيوس صبرى عطية 			تالته ثانوي
290	رؤوف وديع رستم			تالته ثانوي
291	بيتر سمير 			تالته ثانوي
292	ميلاد شبيب الشايب			تالته ثانوي
293	جون نبيل جرجس			تالته ثانوي
294	وسيم أنور متري			تالته ثانوي
295	ميلاد عطية 			تالته ثانوي
296	عماد جرجس كامل			تالته ثانوي
297	مجدي أنور متري			تالته ثانوي
298	شيري طلعت 			
299	عبير جرجس			
300	ماريا ابراهيم			
301	يوستينا جرجس			
302	يوسف القمص صموئيل مترى			مكتبه
303	مارينا طايع غبرى			مكتبه
304	سمر حنا خليل			مكتبه
305	أنطون نجيب اسكندر			مكتبه
306	سوزان غبريال عطا			مكتبه
307	نرجس يونان صادق			مكتبه
308	بيشوى ذكى حلمى			مكتبه
309	ماجد خميس لبيب			مكتبه
310	مارينا سامى فوزى			مكتبه
311	مارى اسحق يوسف			مكتبه
312	ساره رفعت شكرى			مكتبه
313	ماريا رياض 			مدرسه شمامسة
314	مريم صبحي 			مدرسه شمامسة
315	فاتن صابر 			مدرسه شمامسة
316	مينا رزق الله 			مدرسة شمامسة
317	مارينا ياسر 			kg 2
318	تريزا لبيب			
319	مبارك نبيل 			
320	ايريني عيسي 			1,2
321	ديانا صبحي بطرس 			1,2
322	مارتينا نبيل حبيب 			3.4
323	مبارك نبية			امين ابتدائي
324	جورج صفوت			المسيح حياتنا
325	جون تامر			kg1
326	ايريني مكرم 			ثانوي
327	هند جمال ألفى			ثانوي
328	يوستينا ناثان			ثانوي
329	ساميه حبيب			ثانوي
330	تريزا لبيب 			ثانوي
331	بسمه عبد التواب			مكتبه
332	نهى ناجح 			مكتبه
333	مرفت يوحنا			مكتبه
334	مرفت رمزي حنا 			مكتبه
335	ايريني رمزي عيلد جورجي			
336	ماري جرجس وهبه			1,2
338	ايناس مجدي انيس			
339	ماجد عادل فؤاد			
340	مايكل جميل صبحي 			5 ابتدائي
341	هايدي نيكولا			
342	ريمون نبيل 			
343	هدى شهدي 			مشغل
344	كرستين فليمون			
345	لوريس يونان صادق			مكتبة
346	مارى جرجس 			مدرسة شمامسة
347	كرستين ثروت عزيز 			`;

export default function Home() {
  const [members, setMembers] = useState<Member[]>(sampleMembers);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [date, setDate] = useState(today);
  const [form, setForm] = useState<MemberInput>({
    name: "",
    code: "",
    stage: "",
  });
  const [importText, setImportText] = useState(seededImportText);
  const [message, setMessage] = useState("Paste member rows as Name,Code,Stage to bulk import them.");
  const [attendanceMessage, setAttendanceMessage] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const loadSharedMembers = async () => {
      try {
        const sharedMembers = await fetchMembers();
        if (sharedMembers.length > 0) {
          setMembers(sharedMembers);
          setMessage(`Loaded ${sharedMembers.length} members from shared storage.`);
        } else if (seededImportText.trim()) {
          const imported = parseMemberText(seededImportText);
          if (imported.length > 0) {
            setMembers(imported);
            setMessage(`Loaded ${imported.length} members from the seeded list.`);
          }
        }
      } catch {
        const imported = parseMemberText(seededImportText);
        if (imported.length > 0) {
          setMembers(imported);
          setMessage(`Unable to reach shared storage. Loaded ${imported.length} members locally.`);
        } else {
          setMessage("Unable to reach shared storage.");
        }
      } finally {
        setIsLoaded(true);
      }
    };

    const storedAuth = window.localStorage.getItem(adminAuthStorageKey);
    if (storedAuth === "true") {
      setIsAuthenticated(true);
    }

    void loadSharedMembers();
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const persistMembers = async () => {
      try {
        await saveMembers(members);
      } catch {
        setMessage("Unable to save members to shared storage.");
      }
    };

    void persistMembers();
  }, [members, isLoaded]);

  const membersWithCounts = useMemo<MemberWithCounts[]>(
    () =>
      members.map((member) => {
        const attended = member.attendance.filter((entry) => entry.present).length;
        const absent = member.attendance.filter((entry) => entry.present === false).length;
        const todayRecord = member.attendance.find((entry) => entry.date === date);

        return {
          ...member,
          attendedCount: attended,
          absentCount: absent,
          todayStatus: todayRecord ? (todayRecord.present ? "Present" : "Absent") : "Pending",
        };
      }),
    [members, date]
  );

  const filteredMembers = useMemo(() => {
    const matches = searchMembers(membersWithCounts, search);

    if (stageFilter === "all") {
      return matches;
    }

    return matches.filter((member) => member.stage === stageFilter);
  }, [membersWithCounts, search, stageFilter]);

  const summary = useMemo(() => getAttendanceSummary(members, date), [members, date]);

  const stageBreakdown = useMemo(() => {
    const counts = members.reduce<Record<string, number>>((accumulator, member) => {
      const record = member.attendance.find((entry) => entry.date === date);
      if (record?.present) {
        accumulator[member.stage] = (accumulator[member.stage] ?? 0) + 1;
      }
      return accumulator;
    }, {});

    return Object.entries(counts).sort(([left], [right]) => left.localeCompare(right));
  }, [members, date]);

  const markAttendance = (memberId: string, present: boolean) => {
    const existingMember = members.find((member) => member.id === memberId);
    const existingRecord = existingMember?.attendance.find((entry) => entry.date === date);

    if (existingRecord) {
      setAttendanceMessage(`Attendance for ${existingMember?.name ?? "this member"} is already recorded for ${date}.`);
      return;
    }

    setMembers((current) =>
      current.map((member) => {
        if (member.id !== memberId) {
          return member;
        }

        return upsertAttendance(member, date, present);
      })
    );
    setAttendanceMessage(`${existingMember?.name ?? "Member"} marked ${present ? "present" : "absent"} for ${date}.`);
  };

  const handleAdminLogin = (event: FormEvent) => {
    event.preventDefault();

    if (password === "zahaby2026") {
      setIsAuthenticated(true);
      window.localStorage.setItem(adminAuthStorageKey, "true");
      setAuthError("");
      return;
    }

    setAuthError("Incorrect password. Please try zahaby2026.");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword("");
    window.localStorage.removeItem(adminAuthStorageKey);
  };

  const addMember = (event: FormEvent) => {
    event.preventDefault();

    if (!form.name.trim()) {
      return;
    }

    const nextMember = createMember(form);
    setMembers((current) => [...current, nextMember]);
    setForm({ name: "", code: "", stage: "" });
    setMessage(`Added ${nextMember.name} successfully.`);
  };

  const handleSaveToday = async () => {
    try {
      await saveMembers(members);
      setMessage("Saved today's attendance successfully.");
    } catch {
      setMessage("Unable to save today's attendance. Please try again.");
    }
  };

  const importMembers = (event: FormEvent) => {
    event.preventDefault();

    const parsed = parseMemberText(importText);
    if (parsed.length === 0) {
      setMessage("No valid rows were found. Try Name,Code,Stage per line.");
      return;
    }

    setMembers((current) => [...current, ...parsed]);
    setImportText("");
    setMessage(`Imported ${parsed.length} members successfully.`);
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fef3c7,_#0f172a_70%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-md flex-col gap-6 rounded-3xl border border-amber-400/30 bg-slate-950/80 p-8 shadow-2xl shadow-amber-500/10 backdrop-blur">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-300">Admin Access</p>
            <h1 className="mt-2 text-3xl font-bold text-amber-400">Meeting Attendance Dashboard</h1>
            <p className="mt-3 text-sm text-slate-400">Enter the admin password to continue.</p>
          </div>

          <form className="space-y-3" onSubmit={handleAdminLogin}>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
            >
              Login
            </button>
          </form>

          {authError ? <p className="text-sm text-rose-300">{authError}</p> : null}

          <Link
            href="/inquiry"
            className="text-center text-sm font-semibold text-amber-200 underline decoration-amber-400/40 underline-offset-4"
          >
            Open Member Inquiry Page
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fef3c7,_#0f172a_70%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="rounded-3xl border border-amber-400/30 bg-slate-950/80 p-6 shadow-2xl shadow-amber-500/10 backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-300">
                Church of St. Mark and St. Shenouda
              </p>
              <h1 className="mt-2 text-3xl font-bold text-amber-400 sm:text-4xl">
                Meeting Attendance & Management System
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
                Manage attendance, search members quickly, and keep a clean record of participation for every meeting.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="rounded-2xl border border-amber-400/20 bg-slate-900/80 p-4">
                <label className="mb-2 block text-sm font-medium text-amber-200" htmlFor="meeting-date">
                  Meeting Date
                </label>
                <input
                  id="meeting-date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="w-full rounded-xl border border-amber-400/30 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveToday}
                className="rounded-xl border border-emerald-400/30 bg-emerald-900 px-3 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-800"
              >
                Save Today's Attendance
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-amber-400/30 bg-slate-900 px-3 py-2 text-sm font-semibold text-amber-200 transition hover:bg-slate-800"
              >
                Logout
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/40">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-amber-300">Attendance Overview</h2>
                <p className="text-sm text-slate-400">Live summary for {date}</p>
              </div>
              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                <span className="font-semibold">{summary.total}</span> members tracked
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <p className="text-sm text-emerald-200">Today&apos;s Attendance</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-300">{summary.attended}</p>
              </div>
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
                <p className="text-sm text-rose-200">Absent</p>
                <p className="mt-2 text-2xl font-semibold text-rose-300">{summary.absent}</p>
              </div>
              <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4">
                <p className="text-sm text-sky-200">Pending</p>
                <p className="mt-2 text-2xl font-semibold text-sky-300">{summary.pending}</p>
              </div>
            </div>

            {stageBreakdown.length > 0 ? (
              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-sm font-semibold text-amber-300">Attendance by Stage</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {stageBreakdown.map(([stage, count]) => (
                    <span key={stage} className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-sm text-amber-100">
                      {stage}: {count}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            {attendanceMessage ? (
              <p className="mt-3 text-sm text-amber-200">{attendanceMessage}</p>
            ) : null}
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/40">
            <h2 className="text-xl font-semibold text-amber-300">Add New Member</h2>
<p className="mt-2 text-sm text-slate-400">Register a member manually for future meetings. Recognized stages include KG, ebteda2y, e3dady, sanawy, shamasa, and maktaba.</p>

            <form className="mt-5 space-y-3" onSubmit={addMember}>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Full Name"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                required
              />
              <input
                value={form.code}
                onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                placeholder="Member Code"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
              />
              <select
                value={form.stage}
                onChange={(event) => setForm((current) => ({ ...current, stage: event.target.value }))}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
              >
                <option value="">Select Stage</option>
                {stageOptions.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="w-full rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
              >
                Save Member
              </button>
            </form>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/40">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-amber-300">Member Directory</h2>
                <p className="text-sm text-slate-400">Type to filter members instantly by full name or member code, or select a stage.</p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:max-w-xl sm:flex-row">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search full name or code"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                />
                <select
                  value={stageFilter}
                  onChange={(event) => setStageFilter(event.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="all">All stages</option>
                  {stageOptions.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {filteredMembers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-400">
                  No members matched your current search.
                </div>
              ) : (
                filteredMembers.map((member) => {
                  const status = member.attendance.find((entry) => entry.date === date);
                  const isPresent = status?.present ?? false;

                  return (
                    <div
                      key={member.id}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-white">{member.name}</p>
                        <p className="text-sm text-slate-400">Code: {member.code} • Stage: {member.stage}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Present: {member.attendedCount} • Absent: {member.absentCount} • Today: {member.todayStatus}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isPresent ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-700 text-slate-300"}`}>
                          {status ? (isPresent ? "Present" : "Absent") : "Pending"}
                        </span>
                        <button
                          onClick={() => markAttendance(member.id, true)}
                          disabled={Boolean(status)}
                          className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${status ? "cursor-not-allowed bg-slate-700 text-slate-400" : "bg-emerald-500 text-white hover:bg-emerald-400"}`}
                        >
                          {status ? "Recorded" : "Present"}
                        </button>
                        <button
                          onClick={() => markAttendance(member.id, false)}
                          disabled={Boolean(status)}
                          className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${status ? "cursor-not-allowed bg-slate-700 text-slate-400" : "bg-rose-500 text-white hover:bg-rose-400"}`}
                        >
                          {status ? "Recorded" : "Absent"}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/40">
              <h2 className="text-xl font-semibold text-amber-300">Bulk Import</h2>
              <p className="mt-2 text-sm text-slate-400">Paste rows in the format Name,Code,Stage and process them in one step. Recognized stages are KG, ebteda2y, e3dady, sanawy, shamasa, and maktaba.</p>

              <form className="mt-5 space-y-3" onSubmit={importMembers}>
                <textarea
                  value={importText}
                  onChange={(event) => setImportText(event.target.value)}
                  rows={6}
                  placeholder="Abanoub Shenouda,A001,Deacons\nMina Emad,A002,High School"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                />
                <button
                  type="submit"
                  className="w-full rounded-xl border border-amber-400/30 bg-slate-900 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:bg-slate-800"
                >
                  Process Import
                </button>
              </form>
              <p className="mt-3 text-sm text-slate-400">{message}</p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/40">
              <h2 className="text-xl font-semibold text-amber-300">Cloud Database Recommendation</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-400">
                <li>• Use Supabase for a simple relational setup with members, attendance, and dates.</li>
                <li>• Store members in a members table and attendance in an attendance table linked by member ID.</li>
                <li>• Enable authentication for admins and keep public read access only where needed.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}