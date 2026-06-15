import { Bell, MessageSquare } from "lucide-react";

export default function Topbar() {

  return (
    <header className="topbar">

      <div></div>

      <div className="topbar-actions">

        <MessageSquare size={22} />

        <Bell size={22} />

        <img
          src="/police-logo.png"
          alt="Officer"
          className="topbar-avatar"
        />

      </div>

    </header>
  );
}


