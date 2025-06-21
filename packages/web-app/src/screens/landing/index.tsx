import Screen from '@/components/screen';
import "./styles.css";
import {Button} from '@/components/ui/button.tsx';
import {Link} from 'react-router';

export default function LandingScreen() {
  return (
      <Screen>
        <div className="content">
          <h1 className="title"><span>Fuel Passion</span>. <span>Fund Dreams</span>.<br/> <span>Be Funded</span>.</h1>
          <Link to="/sign-up">
            <Button className="main-button" size="lg">Get started</Button>
          </Link>
        </div>
      </Screen>
  );
}