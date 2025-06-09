export default function Spinner() {
  return (
      <div className="w-full h-screen justify-center items-center flex">
        <div className="w-[40px] h-[40px] rounded-full border-t-2 border-l-2 border-zinc-600 animate-spin"></div>
      </div>
  );
}