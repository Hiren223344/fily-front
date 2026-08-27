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
  );
}
