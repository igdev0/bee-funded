import {BellIcon, Settings2Icon} from 'lucide-react';

export default function SettingsBar() {
  return (
      <div className="bg-gray-200 flex justify-end gap-4 p-2 rounded-md shadow-md">
        <Settings2Icon className="stroke-gray-900" size={30}/>
        <BellIcon className="stroke-gray-900" size={30}/>
      </div>
  );
}