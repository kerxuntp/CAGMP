import { Route, Routes } from "react-router-dom";
import './App.css'

import HomePage from './components/HomePage.jsx';
import QuestionPage from './components/QuestionPage.jsx';
import GetUsername from './components/EnterUsername.jsx';
import GetCode from './components/EnterCollectionCode.jsx';
import RulesPage from './components/RulesPage.jsx';
import Leaderboard from './components/LeaderboardPublic.jsx';
import Results from './components/ResultPage.jsx';
import LoginForm from './components/LoginForm.jsx';
import AdminScreen from './components/AdminScreen.jsx';
import CreateQuestion from "./components/CreateQuestion.jsx";
import EditQuestion from "./components/EditQuestion.jsx";
import Questions from "./components/QuestionsBank.jsx";
import Collections from "./components/CollectionsBank.jsx";
import CreateCollection from "./components/CreateCollection.jsx";
import AdminLeaderboard from "./components/LeaderboardAdmin.jsx";
import BadUsernames from "./components/BadUsernames.jsx";
import GlobalSettings from "./components/GlobalSettings.jsx";
import LandingCustomiser from './components/LandingCustomisation';
import GetCollection from "./components/GetCollection.jsx";
import EditCollection from "./components/EditCollection.jsx";
import ManageAdmin from "./components/ManageAdmin.jsx";
import ResetPassword from "./components/ResetPassword.jsx";


export default function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game" element={<QuestionPage />} />
        <Route path="/getname" element={<GetUsername />} />
        <Route path="/getcode" element={<GetCode />} />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/results" element={<Results />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/admin" element={<AdminScreen />} />
        <Route path="/add-question" element={<CreateQuestion />} />
        <Route path="/questions" element={<Questions />} />
        <Route path="/edit-question/:number/:collectionId" element={<EditQuestion />} />
        <Route path="/edit-question/:number" element={<EditQuestion />} />
        <Route path="/add-collection" element={<CreateCollection />} />
        <Route path="/admin-leaderboard" element={<AdminLeaderboard />} />
        <Route path="/bad-usernames" element={<BadUsernames />} />
        <Route path="/global-game-settings" element={<GlobalSettings />} />
        <Route path="/landing-customisation" element={<LandingCustomiser />} />
        <Route path="/collections-bank" element={<Collections />} />
        <Route path="/get-collections/:id" element={<GetCollection />} />
        <Route path="/edit-collection/:id" element={<EditCollection />} />
        <Route path="/manage-admins" element={<ManageAdmin />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </div>
  );
}
