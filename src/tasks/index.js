'use strict';

import React from 'react';
import TaskList from './task-list';
import Tasks from './tasks';
import TaskForm from './task-form';

class TaskPage extends React.Component {

  constructor() {
    super();
    this.state = {
      tasks: Tasks.getAll()
    };
  }

  _onChange() {
    this.setState({ tasks: Tasks.getAll() });
  }

  componentDidMount() {
    Tasks.addChangeListener(this._onChange.bind(this));
  }

  componentWillUnmount() {
    Tasks.removeChangeListener(this._onChange.bind(this));
  }

  render() {
    let tasks = Object.keys(this.state.tasks).map((key) => {
      return this.state.tasks[key];
    });

    return (
      <div className="page">
        <h2 className="text-center"> Tasks </h2>
        <TaskForm />
        <TaskList tasks={tasks}/>
      </div>
    );
  }

}

export default TaskPage;
