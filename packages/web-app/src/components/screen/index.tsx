import {PropsWithChildren} from 'react';
import Navbar from '../navbar';

export default function Screen(props:PropsWithChildren) {
  return (
      <div className="w-full h-full absolute left-0 top-0 overflow-auto">
        <Navbar/>
        {props.children}
      </div>
  )
}