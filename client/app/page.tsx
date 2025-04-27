import FileUploadComponent from './components/file-upload';
import ChatComponent from './components/chat';

export default function Home() {
  return (
    <main className="min-h-screen w-screen flex">
      <div className="w-[30%] min-h-screen p-4 flex justify-center items-center">
        <FileUploadComponent />
      </div>
      <div className="w-[70%] min-h-screen border-l-2">
      <ChatComponent/>
      </div>
    </main>
  );
}