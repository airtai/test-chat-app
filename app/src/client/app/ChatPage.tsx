import type { User } from '@wasp/entities';
import { useLocation } from 'react-router-dom';
import { useHistory } from 'react-router-dom';

import { useQuery } from '@wasp/queries';
import getChat from '@wasp/queries/getChat';
import getAgentResponse from '@wasp/actions/getAgentResponse';
import createNewConversation from '@wasp/actions/createNewConversation';
import updateCurrentChat from '@wasp/actions/updateCurrentChat';
import type { Conversation } from '@wasp/entities';
import { useSocket, useSocketListener } from '@wasp/webSocket';

import getConversations from '@wasp/queries/getConversations';
import ChatLayout from './layout/ChatLayout';
import ConversationsList from '../components/ConversationList';

const Loader = () => {
  return (
    <div className='absolute top-[38%] left-[45%] -translate-y-2/4 -translate-x-2/4'>
      <div className='w-12 h-12 border-4 border-white rounded-full animate-spin border-t-captn-light-blue border-t-4'></div>
    </div>
  );
};

type OutputMessage = {
  role: string;
  content: string;
};

export function prepareOpenAIRequest(input: Conversation[]): OutputMessage[] {
  const messages: OutputMessage[] = input.map((message) => {
    return {
      role: message.role,
      content: message.message,
    };
  });
  return messages;
}

const ChatPage = ({ user }: { user: User }) => {
  // Create all api calls required for chat page here
  const { socket } = useSocket();
  const location = useLocation();
  const { pathname } = location;
  const history = useHistory();
  const queryParams = new URLSearchParams(location.search);

  const activeChatId = Number(pathname.split('/').pop());
  const {
    data: currentChatDetails,
    refetch: refetchChat,
  }: { data: any; refetch: any } = useQuery(
    getChat,
    { chatId: activeChatId },
    { enabled: !!activeChatId }
  );
  const { data: conversations, refetch: refetchConversation } = useQuery(
    getConversations,
    { chatId: activeChatId },
    { enabled: !!activeChatId }
  );

  useSocketListener('newConversationAddedToDB', updateState);

  function updateState() {
    refetchConversation();
    refetchChat();
  }

  const handleFormSubmit = async (
    userQuery: string,
    isUserRespondedWithNextAction: boolean = false
  ) => {
    try {
      const allConversations = await createNewConversation({
        chatId: activeChatId,
        userQuery,
        role: 'user',
      });
      const messages: any = prepareOpenAIRequest(allConversations);
      await updateCurrentChat({
        id: activeChatId,
        data: {
          showLoader: true,
          smartSuggestions: { suggestions: [''], type: '' },
          userRespondedWithNextAction: isUserRespondedWithNextAction,
        },
      });
      const response = await getAgentResponse({
        chatId: activeChatId,
        messages: messages,
        team_id: currentChatDetails.team_id,
        chatType: currentChatDetails.chatType,
        agentChatHistory: currentChatDetails.agentChatHistory,
        proposedUserAction: currentChatDetails.proposedUserAction,
      });
      if (response.team_status === 'inprogress') {
        socket.emit('newConversationAdded', activeChatId);
      }
      response['content'] &&
        (await createNewConversation({
          chatId: activeChatId,
          userQuery: response['content'],
          role: 'assistant',
        }));
      await updateCurrentChat({
        id: activeChatId,
        data: {
          showLoader: false,
          team_id: response['team_id'],
          team_name: response['team_name'],
          team_status: response['team_status'],
          smartSuggestions: response['smart_suggestions'],
        },
      });
    } catch (err: any) {
      await updateCurrentChat({
        id: activeChatId,
        data: { showLoader: false },
      });
      console.log('Error: ' + err.message);
      if (err.message === 'No Subscription Found') {
        history.push('/pricing');
      } else {
        window.alert('Error: Something went wrong. Please try again later.');
      }
    }
  };

  let googleRedirectLoginMsg = queryParams.get('msg');
  if (
    googleRedirectLoginMsg &&
    currentChatDetails?.userRespondedWithNextAction
  ) {
    googleRedirectLoginMsg = null;
  }

  const userSelectedAction: any = queryParams.get('selected_user_action');
  let userSelectedActionMessage: string | null = null;

  if (userSelectedAction) {
    if (!currentChatDetails?.userRespondedWithNextAction) {
      if (currentChatDetails?.proposedUserAction) {
        userSelectedActionMessage =
          currentChatDetails.proposedUserAction[Number(userSelectedAction) - 1];
      }
    }
  }

  return (
    <ChatLayout
      handleFormSubmit={handleFormSubmit}
      currentChatDetails={currentChatDetails}
      googleRedirectLoginMsg={googleRedirectLoginMsg}
      userSelectedActionMessage={userSelectedActionMessage}
    >
      <div className='flex h-full flex-col'>
        {currentChatDetails ? (
          <div
            className={`flex-1 overflow-hidden ${
              currentChatDetails?.showLoader ? 'opacity-60' : 'opacity-100'
            }`}
          >
            {conversations && (
              <ConversationsList
                conversations={conversations}
                currentChatDetails={currentChatDetails}
                handleFormSubmit={handleFormSubmit}
              />
            )}
            {currentChatDetails?.showLoader && <Loader />}
          </div>
        ) : (
          <DefaultMessage />
        )}
      </div>
    </ChatLayout>
  );
};

export default ChatPage;

function DefaultMessage() {
  return (
    <p
      className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl md:text-6xl text-captn-light-cream opacity-70'
      style={{ lineHeight: 'normal' }}
    >
      Please initiate a new chat or select existing chats to resume your
      conversation.
    </p>
  );
}
