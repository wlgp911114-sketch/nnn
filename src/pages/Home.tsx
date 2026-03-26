import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { db, collection, query, orderBy, limit, onSnapshot, Post } from '../firebase';
import { ArrowRight, CheckCircle, Info, Calendar, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

export default function Home() {
  const { settings } = useSettings();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'), limit(3));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      setPosts(postsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-24 pb-24">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?auto=format&fit=crop&q=80&w=1920&h=1080"
            alt="Hero Background"
            className="w-full h-full object-cover opacity-40 grayscale"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black"></div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6"
          >
            {settings.heroTitle}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-400 mb-10"
          >
            {settings.heroSubtitle}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link
              to="/quiz"
              className="inline-flex items-center space-x-3 px-8 py-4 rounded-full text-lg font-bold transition-all transform hover:scale-105"
              style={{ backgroundColor: settings.primaryColor, color: 'black' }}
            >
              <span>지금 퀴즈 풀기</span>
              <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Info Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Calendar, title: '이벤트 기간', desc: '2026년 5월 31일 ~ 6월 7일' },
            { icon: CheckCircle, title: '참여 방법', desc: 'OX 퀴즈 5문항 모두 풀기' },
            { icon: Info, title: '당첨자 발표', desc: '2026년 6월 15일 (개별 연락)' },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-yellow-400/50 transition-colors group"
            >
              <item.icon className="mb-4 text-yellow-400 group-hover:scale-110 transition-transform" size={32} />
              <h3 className="text-xl font-bold mb-2">{item.title}</h3>
              <p className="text-gray-400">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* News/Posts Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-bold mb-2">공지사항 및 소식</h2>
            <p className="text-gray-400">강원금연지원센터의 최신 소식을 확인하세요.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-64 rounded-3xl bg-white/5 animate-pulse"></div>
            ))
          ) : posts.length > 0 ? (
            posts.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group cursor-pointer"
              >
                <div className="relative aspect-video rounded-3xl overflow-hidden mb-4 bg-white/5">
                  {post.imageUrl ? (
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      이미지 없음
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-yellow-400 transition-colors line-clamp-1">
                  {post.title}
                </h3>
                <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                  {post.content}
                </p>
                <div className="flex items-center text-xs text-gray-500 space-x-4">
                  <span className="flex items-center space-x-1">
                    <Calendar size={12} />
                    <span>{new Date(post.createdAt.seconds * 1000).toLocaleDateString()}</span>
                  </span>
                </div>
              </motion.article>
            ))
          ) : (
            <div className="col-span-3 text-center py-12 text-gray-500">
              게시글이 없습니다.
            </div>
          )}
        </div>
      </section>

      {/* Campaign Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-[3rem] bg-yellow-400 p-12 md:p-24 text-black overflow-hidden relative">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
              금연, <br />
              당신의 삶을 바꾸는 <br />
              가장 위대한 선택입니다.
            </h2>
            <p className="text-xl font-medium mb-12 opacity-80">
              강원금연지원센터는 여러분의 건강한 미래를 응원합니다. <br />
              전문가와 함께하는 금연 지원 서비스를 무료로 이용해 보세요.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="tel:033-250-7200"
                className="px-8 py-4 rounded-full bg-black text-white font-bold hover:bg-gray-900 transition-colors"
              >
                상담 문의하기
              </a>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
            <CheckCircle size={400} />
          </div>
        </div>
      </section>
    </div>
  );
}
