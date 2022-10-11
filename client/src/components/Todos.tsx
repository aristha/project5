import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import { Button, Modal, Input, message, Alert, Spin, Space, Card, Upload, Checkbox, Popconfirm } from 'antd';
import {
  EditTwoTone
} from '@ant-design/icons';
import { EditOutlined, EllipsisOutlined, SettingOutlined, UserOutlined, UploadOutlined } from '@ant-design/icons';
import {
  Grid,
  Header,
  Icon
} from 'semantic-ui-react'

import { createTodo, deleteTodo, getTodos, getUploadUrl, patchTodo, uploadFile } from '../api/todos-api'
import Auth from '../auth/Auth'
import { Todo } from '../types/Todo'
const { Search } = Input;
interface TodosProps {
  auth: Auth
  history: History
}
enum UploadState {
  NoUpload,
  FetchingPresignedUrl,
  UploadingFile,
}
interface TodosState {
  todos: Todo[]
  newTodoName: string
  loadingTodos: boolean,
  isModalOpen: boolean,
  openUpload: boolean,
  status: '' | 'error',
  currTodo: Todo | null,
  file: any,
  uploadState: UploadState
}

export class Todos extends React.PureComponent<TodosProps, TodosState> {
  state: TodosState = {
    todos: [],
    newTodoName: '',
    loadingTodos: true,
    isModalOpen: false,
    status: '',
    openUpload: false,
    currTodo: null,
    file: null,
    uploadState: UploadState.NoUpload
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ status: '', newTodoName: event.target.value })
  }

  onEditButtonClick = (todo: Todo) => {
    this.setState({ currTodo: todo, openUpload: true });
    // this.props.history.push(`/todos/${todo.todoId}/edit`)
  }

  onTodoDelete = async (todoId: string) => {
    try {
      await deleteTodo(this.props.auth.getIdToken(), todoId)
      this.setState({
        todos: this.state.todos.filter(todo => todo.todoId !== todoId)
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  onTodoCheck = async (pos: number) => {
    try {
      const todo = this.state.todos[pos]
      await patchTodo(this.props.auth.getIdToken(), todo.todoId, {
        name: todo.name,
        dueDate: todo.dueDate,
        done: !todo.done
      })
      this.setState({
        todos: update(this.state.todos, {
          [pos]: { done: { $set: !todo.done } }
        })
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  async componentDidMount() {
    try {
      const todos = await getTodos(this.props.auth.getIdToken())
      this.setState({
        todos,
        loadingTodos: false
      })
    } catch (e: any) {
      message.error(`Failed to fetch todos: ${e.message}`);
    }
  }
  showFormNewTaks = async () => {

    this.setState({
      isModalOpen: true
    })
  };
  handleOk = async () => {
    this.setState({
      loadingTodos: true
    })
    if (this.state.newTodoName == null || this.state.newTodoName.trim() === '') {
      this.setState({ status: 'error' })
      message.error('Please enter task name');

      return;
    }
    const dueDate = this.calculateDueDate()
    const newTodo = await createTodo(this.props.auth.getIdToken(), {
      name: this.state.newTodoName,
      dueDate
    })
    this.setState({
      todos: [...this.state.todos, newTodo],
      newTodoName: '',
      isModalOpen: false,
      loadingTodos: false
    })

  }

  handleCancel = () => {
    this.setState({
      newTodoName: '',
      isModalOpen: false
    })
  }
  onSearch = async (value: string) => {
    try {
      const todos = await getTodos(this.props.auth.getIdToken(), value)
      this.setState({
        todos,
        loadingTodos: false
      })
    } catch (e: any) {
      message.error(`Failed to fetch todos: ${e.message}`);
    }
  }
  handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    this.setState({
      file: files[0]
    })
  }
  handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault()
    this.setState({
      loadingTodos: true
    })
    try {
      if (!this.state.file) {
        message.error('File should be selected')
        return
      }

      this.setUploadState(UploadState.FetchingPresignedUrl)
      const uploadUrl = await getUploadUrl(this.props.auth.getIdToken(), this.state.currTodo?.todoId)

      this.setUploadState(UploadState.UploadingFile)
      await uploadFile(uploadUrl, this.state.file);
      const todos = await getTodos(this.props.auth.getIdToken())
      this.setState({
        todos
      })
      message.success('File was uploaded!');
    } catch (e: any) {
      message.error(`Could not upload a file:  ${e.message}`)
    } finally {
      this.setUploadState(UploadState.NoUpload);
      this.setState({ openUpload: false, loadingTodos: false })

    }
  }
  handleCancelUpload() {
    this.setState({ openUpload: false, currTodo: null })
  }
  setUploadState(uploadState: UploadState) {
    this.setState({
      uploadState
    })
  }
  renderButton() {

    return (
      <div>
        {this.state.uploadState === UploadState.FetchingPresignedUrl && <p>Uploading image metadata</p>}
        {this.state.uploadState === UploadState.UploadingFile && <p>Uploading file</p>}
        <Button
          onClick={this.handleSubmit}
          loading={this.state.uploadState !== UploadState.NoUpload}
        >
          Upload
        </Button>
      </div>
    )
  }
  render() {
    return (
      <div>
        <Spin spinning={this.state.loadingTodos} tip="Loading..." size='large'>
          <Header as="h1">TODOs</Header>

          {this.renderCreateTodoInput()}

          {this.renderTodos()}
        </Spin>
      </div>
    )
  }

  renderCreateTodoInput() {
    return (
      <Space direction="vertical" size="small" style={{ display: 'flex' }}>

        <Search
          placeholder="input search text"
          allowClear
          enterButton="Search"
          size="large"
          onSearch={this.onSearch}
        />
        <Button type="primary" onClick={this.showFormNewTaks}>
          New Task
        </Button>
        <Modal title="New Task" open={this.state.isModalOpen} onOk={this.handleOk} onCancel={this.handleCancel}>
          <Input
            placeholder="Enter your task name"
            prefix={<UserOutlined className="site-form-item-icon" />}
            allowClear={true}
            value={this.state.newTodoName}
            onChange={this.handleNameChange}
            status={this.state.status}
          />
        </Modal>
        <Modal title="Upload file" open={this.state.openUpload} onOk={this.handleSubmit} onCancel={this.handleCancelUpload}>
          <Space direction="vertical" size="small" style={{ display: 'flex' }}>
            <h1>Upload new image</h1>

            <label>File</label>
            <input
              type="file"
              accept="image/*"
              placeholder="Image to upload"
              onChange={this.handleFileChange}
            />
          </Space>
        </Modal>
      </Space>

    )
  }

  renderTodos() {
    return this.renderTodosList()
  }


  renderTodosList() {
    return (
      <Grid padded>

        {this.state.todos?.map((todo, pos) => {
          return (
            <Grid.Row key={todo.todoId}>
              <Card title={todo.name} style={{ width: 500 }}
                cover={todo.attachmentUrl && <img alt="image" src={todo.attachmentUrl} />}

              >
                <Space size="small" style={{ display: 'flex' }}>
                  <Checkbox
                    onChange={() => this.onTodoCheck(pos)}
                    checked={todo.done}
                  />

                  DueDate: {todo.dueDate}
                  <Button
                    icon
                    color="blue"
                    onClick={() => this.onEditButtonClick(todo)}
                  >
                    <EditTwoTone />
                  </Button>

                  <Popconfirm title="Are you sure delete this task?" okText="Yes" cancelText="No">
                    <Button
                      icon
                      color="red"
                      onClick={() => this.onTodoDelete(todo.todoId)}
                    >
                      <Icon name="delete" />
                    </Button>
                  </Popconfirm>

                </Space>

              </Card>
            </Grid.Row>
          )
        })}
      </Grid>
    )
  }

  calculateDueDate(): string {
    const date = new Date()
    date.setDate(date.getDate() + 7)

    return dateFormat(date, 'yyyy-mm-dd') as string
  }
}
