import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSettings } from '../context/SettingsContext';
import { db, collection, addDoc, Timestamp, handleFirestoreError, OperationType } from '../firebase';
import { Check, X, ArrowRight, ArrowLeft, Trophy, User, Calendar, Phone, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

const personalInfoSchema = z.object({
  name: z.string().min(2, '이름은 2글자 이상이어야 합니다.'),
  birthDate: z.string().length(8, '생년월일 8자리를 입력해주세요 (예: 19900101)'),
  phone: z.string().min(10, '올바른 전화번호를 입력해주세요.'),
  region: z.string().min(1, '지역을 선택해주세요.'),
});

type PersonalInfo = z.infer<typeof personalInfoSchema>;

const questions = [
  { id: 1, text: '전자담배는 일반 담배보다 몸에 해롭지 않다.', answer: false, explanation: '전자담배 또한 니코틴과 각종 유해 물질을 포함하고 있어 건강에 매우 해롭습니다.' },
  { id: 2, text: '금연 후 20분이 지나면 혈압과 맥박이 정상으로 돌아온다.', answer: true, explanation: '금연 즉시 신체는 회복을 시작하며, 20분 만에 혈압과 맥박이 정상화됩니다.' },
  { id: 3, text: '간접흡연은 직접 흡연보다 덜 위험하다.', answer: false, explanation: '간접흡연 시 배출되는 연기에는 독성 물질 농도가 더 높아 주변 사람에게 치명적입니다.' },
  { id: 4, text: '담배를 피우면 스트레스가 해소된다.', answer: false, explanation: '니코틴 금단 현상이 일시적으로 완화되는 것일 뿐, 실제로는 스트레스를 더 유발합니다.' },
  { id: 5, text: '강원금연지원센터의 금연 지원 서비스는 모두 무료이다.', answer: true, explanation: '강원금연지원센터는 국가 지원을 통해 모든 서비스를 무료로 제공합니다.' },
];

export default function Quiz() {
  const { settings } = useSettings();
  const [step, setStep] = useState<'info' | 'quiz' | 'result'>('info');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(boolean | null)[]>(Array(questions.length).fill(null));
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<PersonalInfo>({
    resolver: zodResolver(personalInfoSchema),
  });

  const onInfoSubmit = (data: PersonalInfo) => {
    setPersonalInfo(data);
    setStep('quiz');
  };

  const handleAnswer = (answer: boolean) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    } else {
      setTimeout(() => submitResults(newAnswers), 300);
    }
  };

  const submitResults = async (finalAnswers: (boolean | null)[]) => {
    if (!personalInfo) return;
    setSubmitting(true);

    const score = finalAnswers.reduce((acc, ans, idx) => {
      return acc + (ans === questions[idx].answer ? 1 : 0);
    }, 0);

    const submissionData = {
      ...personalInfo,
      quizResults: finalAnswers.map((ans, idx) => ({
        questionId: questions[idx].id,
        userAnswer: ans,
        isCorrect: ans === questions[idx].answer
      })),
      score,
      submittedAt: Timestamp.now(),
    };

    try {
      await addDoc(collection(db, 'submissions'), submissionData);
      setStep('result');
      toast.success('퀴즈 참여가 완료되었습니다!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'submissions');
      toast.error('제출 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const score = answers.reduce((acc, ans, idx) => {
    return acc + (ans === questions[idx].answer ? 1 : 0);
  }, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-24">
      <AnimatePresence mode="wait">
        {step === 'info' && (
          <motion.div
            key="info"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white/5 border border-white/10 rounded-[3rem] p-8 md:p-12"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4" style={{ color: settings.primaryColor }}>
                참여자 정보 입력
              </h2>
              <p className="text-gray-400">이벤트 경품 발송을 위해 정확한 정보를 입력해주세요.</p>
            </div>

            <form onSubmit={handleSubmit(onInfoSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                    <User size={14} /> 이름
                  </label>
                  <input
                    {...register('name')}
                    placeholder="홍길동"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:border-yellow-400 outline-none transition-colors"
                  />
                  {errors.name && <p className="text-red-400 text-xs">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                    <Calendar size={14} /> 생년월일 (8자리)
                  </label>
                  <input
                    {...register('birthDate')}
                    placeholder="19900101"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:border-yellow-400 outline-none transition-colors"
                  />
                  {errors.birthDate && <p className="text-red-400 text-xs">{errors.birthDate.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                    <Phone size={14} /> 휴대폰 번호
                  </label>
                  <input
                    {...register('phone')}
                    placeholder="01012345678"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:border-yellow-400 outline-none transition-colors"
                  />
                  {errors.phone && <p className="text-red-400 text-xs">{errors.phone.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                    <MapPin size={14} /> 거주 지역
                  </label>
                  <select
                    {...register('region')}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:border-yellow-400 outline-none transition-colors appearance-none"
                  >
                    <option value="" className="bg-black">지역 선택</option>
                    {['춘천', '원주', '강릉', '동해', '태백', '속초', '삼척', '홍천', '횡성', '영월', '평창', '정선', '철원', '화천', '양구', '인제', '고성', '양양'].map(r => (
                      <option key={r} value={r} className="bg-black">{r}</option>
                    ))}
                  </select>
                  {errors.region && <p className="text-red-400 text-xs">{errors.region.message}</p>}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-2xl font-bold text-black transition-all transform hover:scale-[1.02]"
                style={{ backgroundColor: settings.primaryColor }}
              >
                퀴즈 시작하기
              </button>
            </form>
          </motion.div>
        )}

        {step === 'quiz' && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-center mb-12">
              <div className="space-y-1">
                <span className="text-yellow-400 font-bold text-sm tracking-widest uppercase">Question {currentQuestion + 1} of {questions.length}</span>
                <h2 className="text-2xl font-bold">{settings.quizTitle}</h2>
              </div>
              <div className="flex gap-1">
                {questions.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-8 rounded-full transition-colors ${
                      i === currentQuestion ? 'bg-yellow-400' : i < currentQuestion ? 'bg-yellow-400/30' : 'bg-white/10'
                    }`}
                  ></div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 text-center min-h-[300px] flex flex-col justify-center items-center">
              <motion.p
                key={currentQuestion}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl md:text-3xl font-bold leading-relaxed"
              >
                {questions[currentQuestion].text}
              </motion.p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <button
                onClick={() => handleAnswer(true)}
                disabled={submitting}
                className="group flex flex-col items-center justify-center p-12 rounded-[2rem] bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all transform hover:scale-105"
              >
                <Check size={64} className="text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
                <span className="text-2xl font-black text-blue-400">O</span>
              </button>
              <button
                onClick={() => handleAnswer(false)}
                disabled={submitting}
                className="group flex flex-col items-center justify-center p-12 rounded-[2rem] bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all transform hover:scale-105"
              >
                <X size={64} className="text-red-400 mb-4 group-hover:scale-110 transition-transform" />
                <span className="text-2xl font-black text-red-400">X</span>
              </button>
            </div>
          </motion.div>
        )}

        {step === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-12"
          >
            <div className="relative inline-block">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12, delay: 0.2 }}
                className="bg-yellow-400 p-8 rounded-full"
              >
                <Trophy size={80} className="text-black" />
              </motion.div>
              <div className="absolute -top-4 -right-4 bg-white text-black font-black px-4 py-2 rounded-full text-xl">
                {score}/{questions.length}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-4xl font-black">퀴즈 완료!</h2>
              <p className="text-xl text-gray-400">
                {personalInfo?.name}님, 참여해주셔서 감사합니다. <br />
                당첨 결과는 추후 입력하신 번호로 개별 연락 드립니다.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 text-left space-y-6">
              <h3 className="font-bold text-yellow-400">정답 확인</h3>
              <div className="space-y-4">
                {questions.map((q, i) => (
                  <div key={q.id} className="flex gap-4 items-start border-b border-white/5 pb-4 last:border-0">
                    <div className={`mt-1 p-1 rounded-full ${answers[i] === q.answer ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {answers[i] === q.answer ? <Check size={14} /> : <X size={14} />}
                    </div>
                    <div>
                      <p className="font-medium mb-1">{q.text}</p>
                      <p className="text-xs text-gray-500">{q.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.href = '/'}
                className="px-8 py-4 rounded-full font-bold bg-white text-black hover:bg-yellow-400 transition-colors"
              >
                홈으로 돌아가기
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
