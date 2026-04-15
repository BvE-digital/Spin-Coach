import { useMsal } from '@azure/msal-react'
import { loginRequest } from '../../config/msalConfig'
import { Button } from '../ui/Button'

export function LoginPage() {
  const { instance } = useMsal()

  function handleLogin() {
    void instance.loginRedirect(loginRequest)
  }

  return (
    <div className="min-h-screen bg-nutreco-blue flex flex-col items-center justify-center px-6">
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-white rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
          <span className="text-4xl font-bold text-nutreco-blue">S</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">SPIN Coach</h1>
        <p className="text-blue-200 text-lg">Nutreco Field Sales Debrief AI</p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-xl font-semibold text-nutreco-neutral mb-2">Welcome back</h2>
        <p className="text-gray-500 text-sm mb-6">
          Sign in with your Nutreco Microsoft account to continue.
        </p>
        <Button className="w-full" onClick={handleLogin}>
          <svg className="w-5 h-5 mr-2" viewBox="0 0 21 21" fill="none">
            <rect x="1" y="1" width="9" height="9" fill="#f25022" />
            <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
            <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
            <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
          </svg>
          Sign in with Microsoft
        </Button>
      </div>

      <p className="text-blue-300 text-xs mt-8 text-center">
        © {new Date().getFullYear()} Nutreco N.V. All rights reserved.
      </p>
    </div>
  )
}
