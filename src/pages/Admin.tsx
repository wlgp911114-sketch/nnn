import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { db, collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp, Post, handleFirestoreError, OperationType } from '../firebase';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings as SettingsIcon, 
  Plus, 
  Trash2, 
  Edit, 
  ChevronRight, 
  Download,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';

export default function Admin() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast.error('관리자 권한이 없습니다.');
      navigate('/');
    }
  }, [isAdmin, authLoading, navigate]);

  if (authLoading) return <div className="flex items-center justify-center h-screen">로딩 중...</div>;
  if (!isAdmin) return null;

  return (
    <div className="flex min-h-screen bg-black">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 p-6 hidden lg:block">
        <div className="space-y-8">
          <div className="px-4">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">관리자 메뉴</h2>
          </div>
          <nav className="space-y-2">
            <AdminNavLink to="/admin" icon={LayoutDashboard} label="대시보드" end />
            <AdminNavLink to="/admin/submissions" icon={Users} label="참여자 관리" />
            <AdminNavLink to="/admin/posts" icon={FileText} label="게시글 관리" />
            <AdminNavLink to="/admin/settings" icon={SettingsIcon} label="사이트 설정" />
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="submissions" element={<Submissions />} />
          <Route path="posts" element={<PostsManagement />} />
          <Route path="settings" element={<SettingsManagement />} />
        </Routes>
      </main>
    </div>
  );
}

function AdminNavLink({ to, icon: Icon, label, end = false }: { to: string, icon: any, label: string, end?: boolean }) {
  const location = useLocation();
  const isActive = end ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <Link
      to={to}
      className={`flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
        isActive ? 'bg-yellow-400 text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </Link>
  );
}

function Dashboard() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    const subUnsub = onSnapshot(collection(db, 'submissions'), (snap) => {
      setSubmissions(snap.docs.map(doc => doc.data()));
    });
    const postUnsub = onSnapshot(collection(db, 'posts'), (snap) => {
      setPosts(snap.docs.map(doc => doc.data()));
    });
    return () => { subUnsub(); postUnsub(); };
  }, []);

  const regionalData = submissions.reduce((acc: any, sub) => {
    acc[sub.region] = (acc[sub.region] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(regionalData).map(([name, value]) => ({ name, value }));
  
  const scoreData = [0, 1, 2, 3, 4, 5].map(score => ({
    score: `${score}점`,
    count: submissions.filter(s => s.score === score).length
  }));

  const COLORS = ['#FACC15', '#3B82F6', '#EF4444', '#10B981', '#8B5CF6', '#F97316'];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">대시보드</h1>
        <p className="text-gray-400">이벤트 참여 현황을 한눈에 확인하세요.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} label="총 참여자" value={submissions.length} color="text-yellow-400" />
        <StatCard icon={TrendingUp} label="평균 점수" value={(submissions.reduce((a, b) => a + b.score, 0) / (submissions.length || 1)).toFixed(1)} color="text-blue-400" />
        <StatCard icon={FileText} label="게시글 수" value={posts.length} color="text-green-400" />
        <StatCard icon={BarChart3} label="오늘 참여" value={submissions.filter(s => new Date(s.submittedAt.seconds * 1000).toDateString() === new Date().toDateString()).length} color="text-purple-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
            <PieChartIcon size={20} className="text-yellow-400" /> 지역별 참여 분포
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-8">
            {chartData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                <span>{d.name}: {d.value as number}명</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-400" /> 점수 분포
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="score" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center space-x-4">
      <div className={`p-4 rounded-2xl bg-white/5 ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function Submissions() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'submissions'), orderBy('submittedAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setSubmissions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  const filtered = submissions.filter(s => 
    s.name.includes(searchTerm) || s.phone.includes(searchTerm) || s.region.includes(searchTerm)
  );

  const exportToCSV = () => {
    const headers = ['이름', '생년월일', '전화번호', '지역', '점수', '제출시간'];
    const rows = filtered.map(s => [
      s.name,
      s.birthDate,
      s.phone,
      s.region,
      s.score,
      new Date(s.submittedAt.seconds * 1000).toLocaleString()
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `submissions_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">참여자 관리</h1>
          <p className="text-gray-400">퀴즈 참여자 정보 및 결과를 확인하세요.</p>
        </div>
        <button 
          onClick={exportToCSV}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-black font-bold hover:bg-yellow-400 transition-colors"
        >
          <Download size={18} /> 엑셀 다운로드
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        <input 
          type="text"
          placeholder="이름, 전화번호, 지역으로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:border-yellow-400 outline-none transition-colors"
        />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">이름</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">생년월일</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">전화번호</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">지역</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">점수</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">제출시간</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-medium">{s.name}</td>
                <td className="px-6 py-4 text-gray-400">{s.birthDate}</td>
                <td className="px-6 py-4 text-gray-400">{s.phone}</td>
                <td className="px-6 py-4 text-gray-400">{s.region}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${s.score === 5 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {s.score} / 5
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">
                  {new Date(s.submittedAt.seconds * 1000).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PostsManagement() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPost, setCurrentPost] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'posts', id));
      toast.success('게시글이 삭제되었습니다.');
    } catch (error) {
      toast.error('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      imageUrl: formData.get('imageUrl') as string,
      updatedAt: Timestamp.now(),
    };

    try {
      if (currentPost) {
        await updateDoc(doc(db, 'posts', currentPost.id), data);
        toast.success('게시글이 수정되었습니다.');
      } else {
        await addDoc(collection(db, 'posts'), {
          ...data,
          createdAt: Timestamp.now(),
          authorId: user?.uid
        });
        toast.success('게시글이 작성되었습니다.');
      }
      setIsEditing(false);
      setCurrentPost(null);
    } catch (error) {
      toast.error('저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">게시글 관리</h1>
          <p className="text-gray-400">새로운 소식을 작성하고 관리하세요.</p>
        </div>
        <button 
          onClick={() => { setIsEditing(true); setCurrentPost(null); }}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-yellow-400 text-black font-bold hover:bg-yellow-500 transition-colors"
        >
          <Plus size={18} /> 새 글 작성
        </button>
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white/5 border border-white/10 rounded-[2rem] p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">제목</label>
                  <input 
                    name="title"
                    defaultValue={currentPost?.title}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:border-yellow-400 outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">이미지 URL</label>
                  <input 
                    name="imageUrl"
                    defaultValue={currentPost?.imageUrl}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:border-yellow-400 outline-none transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">내용</label>
                <textarea 
                  name="content"
                  defaultValue={currentPost?.content}
                  required
                  rows={6}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:border-yellow-400 outline-none transition-colors resize-none"
                />
              </div>
              <div className="flex justify-end gap-4">
                <button 
                  type="button"
                  onClick={() => { setIsEditing(false); setCurrentPost(null); }}
                  className="px-6 py-3 rounded-2xl text-gray-400 hover:text-white transition-colors"
                >
                  취소
                </button>
                <button 
                  type="submit"
                  className="px-8 py-3 rounded-2xl bg-white text-black font-bold hover:bg-yellow-400 transition-colors"
                >
                  {currentPost ? '수정 완료' : '작성 완료'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post) => (
          <div key={post.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 flex gap-6">
            <div className="w-32 h-32 rounded-2xl bg-white/5 overflow-hidden flex-shrink-0">
              {post.imageUrl && <img src={post.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
            </div>
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold mb-1 line-clamp-1">{post.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2">{post.content}</p>
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-xs text-gray-600">{new Date(post.createdAt.seconds * 1000).toLocaleDateString()}</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setCurrentPost(post); setIsEditing(true); }}
                    className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(post.id)}
                    className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsManagement() {
  const { settings, updateSettings } = useSettings();
  const [formData, setFormData] = useState(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings(formData);
      toast.success('설정이 저장되었습니다.');
    } catch (error) {
      toast.error('저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">사이트 설정</h1>
        <p className="text-gray-400">웹사이트의 디자인과 텍스트를 자유롭게 커스터마이징하세요.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-widest">기본 정보</h3>
              <div className="space-y-2">
                <label className="text-sm text-gray-500">사이트 이름</label>
                <input 
                  value={formData.siteName}
                  onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:border-yellow-400 outline-none transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-500">포인트 컬러 (Hex)</label>
                <div className="flex gap-4">
                  <input 
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-12 h-12 bg-transparent border-0 cursor-pointer"
                  />
                  <input 
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:border-yellow-400 outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-widest">히어로 섹션</h3>
              <div className="space-y-2">
                <label className="text-sm text-gray-500">메인 타이틀</label>
                <input 
                  value={formData.heroTitle}
                  onChange={(e) => setFormData({ ...formData, heroTitle: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:border-yellow-400 outline-none transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-500">서브 타이틀</label>
                <input 
                  value={formData.heroSubtitle}
                  onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:border-yellow-400 outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-8 border-t border-white/10">
            <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-widest">퀴즈 설정</h3>
            <div className="space-y-2">
              <label className="text-sm text-gray-500">퀴즈 타이틀</label>
              <input 
                value={formData.quizTitle}
                onChange={(e) => setFormData({ ...formData, quizTitle: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:border-yellow-400 outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            type="submit"
            className="px-12 py-4 rounded-2xl bg-white text-black font-bold hover:bg-yellow-400 transition-all transform hover:scale-105"
          >
            설정 저장하기
          </button>
        </div>
      </form>
    </div>
  );
}
