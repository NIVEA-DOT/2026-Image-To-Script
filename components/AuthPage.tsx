
import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import Button from './Button';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      let msg = "오류가 발생했습니다.";
      if (err.code === 'auth/invalid-email') msg = "유효하지 않은 이메일 형식입니다.";
      if (err.code === 'auth/user-disabled') msg = "비활성화된 사용자입니다.";
      if (err.code === 'auth/user-not-found') msg = "사용자를 찾을 수 없습니다.";
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') msg = "이메일 또는 비밀번호가 올바르지 않습니다.";
      if (err.code === 'auth/email-already-in-use') msg = "이미 사용 중인 이메일입니다.";
      if (err.code === 'auth/weak-password') msg = "비밀번호는 6자리 이상이어야 합니다.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f2f4f6]">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] toss-shadow p-10 animate-in zoom-in-95 duration-300">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-[#191f28] mb-2">
            YouTube <span className="text-[#3182f6]">Automation</span>
          </h1>
          <p className="text-[#8b95a1] font-medium">
            {isLogin ? '서비스 이용을 위해 로그인해주세요.' : '새로운 계정을 생성합니다.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#8b95a1] ml-1 uppercase tracking-wider">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-[#f9fafb] border border-gray-200 focus:border-[#3182f6] rounded-2xl outline-none transition-all font-medium"
              placeholder="name@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[#8b95a1] ml-1 uppercase tracking-wider">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-[#f9fafb] border border-gray-200 focus:border-[#3182f6] rounded-2xl outline-none transition-all font-medium"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-500 rounded-xl text-sm font-medium text-center">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            fullWidth 
            className="h-14 bg-[#3182f6] text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 mt-4"
            disabled={isLoading}
          >
            {isLoading ? '처리 중...' : (isLogin ? '로그인' : '회원가입')}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            className="text-sm text-[#8b95a1] font-bold hover:text-[#333d4b] transition-colors"
          >
            {isLogin ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
