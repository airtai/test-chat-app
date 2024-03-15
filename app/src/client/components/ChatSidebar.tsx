import { type Chat } from "wasp/entities";
import { createNewChat, useQuery, getChats } from "wasp/client/operations";
import React, { useEffect, useRef, useState, MouseEventHandler } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { NavLink, useLocation } from 'react-router-dom';
import Logo from '../static/logo-for-dark-bg.png';
import SidebarLinkGroup from '../admin/components/SidebarLinkGroup';

interface ChatSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

const ChatSidebar = ({ sidebarOpen, setSidebarOpen }: ChatSidebarProps) => {
  const history = useHistory();
  const location = useLocation();
  const { pathname } = location;
  const activeChat = Number(pathname.split('/').pop());

  const trigger = useRef<any>(null);
  const sidebar = useRef<any>(null);

  const storedSidebarExpanded = localStorage.getItem('sidebar-expanded');
  const [sidebarExpanded, setSidebarExpanded] = useState(
    storedSidebarExpanded === null ? false : storedSidebarExpanded === 'true'
  );
  const { data: chats, isLoading: isLoadingChats } = useQuery(getChats);

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (
        !sidebarOpen ||
        sidebar.current.contains(target) ||
        trigger.current.contains(target)
      )
        return;
      setSidebarOpen(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  });

  useEffect(() => {
    localStorage.setItem('sidebar-expanded', sidebarExpanded.toString());
    if (sidebarExpanded) {
      document.querySelector('body')?.classList.add('sidebar-expanded');
    } else {
      document.querySelector('body')?.classList.remove('sidebar-expanded');
    }
  }, [sidebarExpanded]);

  const handleCreateNewChat: MouseEventHandler<HTMLAnchorElement> = async (
    event
  ) => {
    try {
      const chat: Chat = await createNewChat();
      history.push(`/chat/${chat.id}`);
    } catch (err: any) {
      console.log('Error: ' + err.message);
      if (err.message === 'No Subscription Found') {
        history.push('/pricing');
      } else {
        window.alert('Error: Something went wrong. Please try again later.');
      }
    }
  };

  return (
    <aside
      ref={sidebar}
      className={`border-r-2 absolute left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-captn-dark-blue duration-300 ease-linear dark:bg-captn-dark-blue lg:static lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* <!-- SIDEBAR HEADER --> */}
      <div className='flex items-center gap-2 px-6 py-5.5 lg:py-3.5'>
        <>
          <NavLink to='/'>
            <img src={Logo} alt='Logo' className='h-10 w-auto mt-2' />
          </NavLink>
          <span className='mt-2 text-sm font-semibold leading-6 dark:text-captn-light-cream'>
            <sup className='text-base text-captn-light-blue'>βeta</sup>
          </span>
        </>

        <button
          ref={trigger}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-controls='sidebar'
          aria-expanded={sidebarOpen}
          className='block lg:hidden text-captn-light-cream'
        >
          <svg
            className='fill-current'
            width='20'
            height='18'
            viewBox='0 0 20 18'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              d='M19 8.175H2.98748L9.36248 1.6875C9.69998 1.35 9.69998 0.825 9.36248 0.4875C9.02498 0.15 8.49998 0.15 8.16248 0.4875L0.399976 8.3625C0.0624756 8.7 0.0624756 9.225 0.399976 9.5625L8.16248 17.4375C8.31248 17.5875 8.53748 17.7 8.76248 17.7C8.98748 17.7 9.17498 17.625 9.36248 17.475C9.69998 17.1375 9.69998 16.6125 9.36248 16.275L3.02498 9.8625H19C19.45 9.8625 19.825 9.4875 19.825 9.0375C19.825 8.55 19.45 8.175 19 8.175Z'
              fill=''
            />
          </svg>
        </button>
      </div>
      <div>
        <Link
          to='#'
          className='no-underline mt-7 my-1 mx-4 mb-10 flex items-center justify-left gap-2.5 rounded-md bg-captn-cta-green py-4 px-4 text-center font-medium text-captn-light-cream hover:bg-opacity-90'
          onClick={handleCreateNewChat}
        >
          <span>
            <svg
              stroke='currentColor'
              fill='none'
              strokeWidth='2'
              viewBox='0 0 24 24'
              strokeLinecap='round'
              strokeLinejoin='round'
              className='icon-sm shrink-0'
              height='1em'
              width='1em'
              xmlns='http://www.w3.org/2000/svg'
            >
              <line x1='12' y1='5' x2='12' y2='19'></line>
              <line x1='5' y1='12' x2='19' y2='12'></line>
            </svg>
          </span>
          New chat
        </Link>
      </div>
      {/* <!-- SIDEBAR HEADER --> */}

      <div className='no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear'>
        {/* <!-- Sidebar Menu --> */}

        <nav className='mt-1 py-1 px-4 '>
          {/* <!-- Menu Group --> */}
          <div>
            <h3 className='mb-4 ml-4 text-sm font-semibold text-bodydark2'>
              CHATS
            </h3>

            <ul className='mb-6 flex flex-col gap-1.5'>
              {/* <!-- Menu Item Dashboard --> */}
              <li>
                {chats &&
                  chats.map((chat: Chat, idx) => (
                    <NavLink
                      key={chat.id}
                      to={`/chat/${chat.id}?`}
                      className={`no-underline group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out ${
                        pathname === '/' && 'bg-gray-700 dark:bg-meta-4'
                      } ${
                        chat.id === activeChat
                          ? 'bg-captn-light-cream text-captn-dark-blue hover:bg-captn-light-blue hover:text-captn-dark-blue'
                          : 'text-captn-light-cream hover:bg-captn-light-blue hover:text-captn-dark-blue'
                      }`}
                    >
                      <svg
                        stroke='currentColor'
                        fill='none'
                        strokeWidth='2'
                        viewBox='0 0 24 24'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        className='icon-sm'
                        height='1em'
                        width='1em'
                        xmlns='http://www.w3.org/2000/svg'
                      >
                        <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'></path>
                      </svg>
                      <span className='ml-3'>{chat.id}</span>
                    </NavLink>
                  ))}
              </li>
            </ul>
          </div>
        </nav>
        {/* <!-- Sidebar Menu --> */}
      </div>
    </aside>
  );
};

export default ChatSidebar;
