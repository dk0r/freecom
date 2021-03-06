import React, { Component } from 'react'
import cx from 'classnames'
import './App.css'
import Chat from './Chat'
import ChatHeader from './ChatHeader'
import ConversationsList from './ConversationsList'
import ConversationsListHeader from './ConversationsListHeader'
import ToggleOpeningStateButton from './ToggleOpeningStateButton'
import { timeDifferenceForDate, sortConversationByDateCreated, generateShortStupidName } from '../utils'
import {TEST_WITH_NEW_CUSTOMER, FREECOM_CUSTOMER_ID_KEY, FREECOM_CUSTOMER_NAME_KEY,
  MAX_USERNAME_LENGTH} from '../constants'

import gql from 'graphql-tag'

//Make below mutation functionality available to the App component
import { graphql } from 'react-apollo'
//Mutation is finally combined w/ App component on LINE-191


//New Customer Mutation ==> //New Slack Conversation && //Returns Payload after mutation is performed
const createCustomerAndFirstConversation = gql`
  mutation createCustomer($name: String!) {
    createCustomer(name: $name, conversations: [
      {
        slackChannelIndex: 1,
      }
    ]) {
      id
      name
      conversations {
        id
        updatedAt
        slackChannelIndex
        agent {
          id
          slackUserName
          imageUrl
        }
        messages(last: 1) {
          id
          text
          createdAt
        }
      }
    }
  }
`

class App extends Component {

  state = {
    isOpen: false,
    selectedConversationId: null,
    conversations: [],
  }

  async componentDidMount() {

    // TESTING
    if (TEST_WITH_NEW_CUSTOMER) {
      localStorage.removeItem(FREECOM_CUSTOMER_ID_KEY)
      localStorage.removeItem(FREECOM_CUSTOMER_NAME_KEY)
    }

    const customerId = localStorage.getItem(FREECOM_CUSTOMER_ID_KEY)
    const username = localStorage.getItem(FREECOM_CUSTOMER_NAME_KEY)

    if (customerId && username) {
      // customer already exists, find all conversations for that customer
      this._loadConversations(customerId)
    } else {
      // customer doesn't exist yet, create new
      this._setupNewCustomer()
    }

  }

  render() {
    const customerId = localStorage.getItem(FREECOM_CUSTOMER_ID_KEY)
    const shouldRenderChat = this.state.selectedConversationId && customerId
    const panelStyles = cx(`panel drop-shadow radius overflow-hidden ${this.state.isOpen ? 'fadeInUp' : 'hide'}`)
    return (
      <div className='App'>
        <div>
          <div className='container'>
            <div className={panelStyles}>
              {shouldRenderChat ? this._renderChat(customerId) : this._renderConversationsList()}
            </div>
            <ToggleOpeningStateButton
              isOpen={this.state.isOpen}
              togglePanel={this._togglePanel}
              mainColor={this.props.freecom.mainColor}
            />
          </div>
        </div>
      </div>
    )
  }

  _renderConversationsList = () => {
    return (
      <span>
        <ConversationsListHeader
          mainColor={this.props.freecom.mainColor}
          companyName={this.props.freecom.companyName}
        />
        <div className='body overflow-y-scroll overflow-x-hidden'>
          <ConversationsList
            conversations={this.state.conversations}
            onSelectConversation={this._onSelectConversation}
            companyLogoURL={this.props.freecom.companyLogoURL}
            companyName={this.props.freecom.companyName}
          />
          <div className='flex flex-hcenter full-width conversation-button-wrapper pointer-events-none'>
            <div
              className='conversation-button background-darkgray drop-shadow-hover pointer flex-center flex pointer-events-initial'
              onClick={() => this._initiateNewConversation()}
            >
              <p>New Conversation</p>
            </div>
          </div>
        </div>
      </span>
    )
  }

  _renderChat = (customerId) => {
    const {freecom} = this.props
    const selectedConversation = this.state.conversations.find(c => c.id === this.state.selectedConversationId)
    const { agent } = selectedConversation
    const chatPartnerName = agent ? selectedConversation.agent.slackUserName : freecom.companyName
    const profileImageUrl = agent && agent.imageUrl ? agent.imageUrl : freecom.companyLogoURL
    const created = timeDifferenceForDate(selectedConversation.updatedAt)
    return (
      <span>
        <ChatHeader
          chatPartnerName={chatPartnerName}
          agentId={selectedConversation.agent ? selectedConversation.agent.id : null}
          headerColor={freecom.mainColor}
          resetConversation={this._resetConversation}
          profileImageUrl={profileImageUrl}
          created={created}
          shouldDisplayBackButton={selectedConversation.messages.length > 0}
        />
        <Chat
          conversationId={this.state.selectedConversationId}
          mainColor={freecom.mainColor}
          customerId={customerId}
          resetConversation={this._resetConversation}
          secondsUntilRerender={this.state.secondsUntilRerender}
          profileImageURL={freecom.companyLogoURL}
        />
      </span>
    )
  }


  _setupNewCustomer = async () => {
    const username = generateShortStupidName(MAX_USERNAME_LENGTH)
    const result = await this.props.createCustomerAndFirstConversationMutation({
      variables: {
        name: username,
      }
    })
    const customerId = result.data.createCustomer.id
    localStorage.setItem(FREECOM_CUSTOMER_ID_KEY, customerId)
    localStorage.setItem(FREECOM_CUSTOMER_NAME_KEY, username)
    this.setState({
      conversations: result.data.createCustomer.conversations,
      selectedConversationId: result.data.createCustomer.conversations[0].id
    })

  }

  _loadConversations = async (customerId) => {

  }

  _initiateNewConversation = () => {

  }

  _createNewConversation = async (customerId, username) => {

  }

  _onSelectConversation = (conversation) => {
    this.setState({
      selectedConversationId: conversation.id,
    })
  }

  _resetConversation = () => {
    this.setState({
      selectedConversationId: null,
    })
  }

  _togglePanel = () => this.setState({isOpen: !this.state.isOpen})
}



//Combines createCustomeAnd.. mutation with the App component. Accepts (actualMutationFunction, nameForMutations)
//This basically injects the mutation as a prop of the App component which allows mutations to be sent to backend
export default graphql(createCustomerAndFirstConversation, {name: 'createCustomerAndFirstConversationMutation'})(App)
