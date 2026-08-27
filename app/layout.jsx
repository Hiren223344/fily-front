import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata = {
  title: 'FilyBase — Serverless Inference API',
  description: 'Deploy Llama, Mixtral, Qwen, Stable Diffusion, Whisper and your own fine-tunes on dedicated GPU infrastructure that scales to zero.',
  icons: {
    icon: '/uploads/logoipsum-392.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_ZXRlcm5hbC1waWdsZXQtNDIuY2xlcmsuYWNjb3VudHMuZGV2JA'}
      appearance={{
        variables: {
          colorPrimary: '#2c2e2a',
          colorText: '#2c2e2a',
          colorBackground: '#ffffff',
          borderRadius: '24px',
          fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
        },
        elements: {
          card: {
            backgroundColor: '#ffffff',
            borderRadius: '40px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
            border: '1px solid #e0dbce',
            padding: '32px',
          },
          formButtonPrimary: {
            backgroundColor: '#2c2e2a',
            color: '#f5f1e4',
            borderRadius: '50px',
            padding: '14px',
            fontSize: '14px',
            fontWeight: '500',
            '&:hover': {
              backgroundColor: '#3a3c34',
            },
          },
          formFieldInput: {
            backgroundColor: '#f5f1e4',
            borderColor: '#e0dbce',
            borderRadius: '10px',
            color: '#2c2e2a',
            padding: '12px 16px',
            '&:focus': {
              borderColor: '#8ed462',
            },
          },
          socialButtonsBlockButton: {
            backgroundColor: '#f5f1e4',
            borderColor: '#e0dbce',
            borderRadius: '50px',
            padding: '12px',
            color: '#2c2e2a',
            fontWeight: '500',
          },
          footerActionLink: {
            color: '#2c2e2a',
            fontWeight: '500',
            textDecoration: 'underline',
          },
        },
      }}
    >
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        </head>
        <body>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
