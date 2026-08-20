import { v4 as uuidv4 } from 'uuid'

export type ProjectStatus = "pending" | "active" | "finished"
export type UserRole = "architect" | "engineer" | "developer"

export type ToDoStatus = "todo" | "in-progress" | "done"

export interface IToDo {
  id?: string
  title: string
  description?: string
  status: ToDoStatus
  dueDate?: string

}

export interface IProject {
  name: string
  description: string
  status: ProjectStatus
  userRole: UserRole
  cost: number
  finishDate: Date
  todos?: IToDo[]
}

export class Project implements IProject {
  // To satisfy IProject
  name: string
  description: string
  status: ProjectStatus
  userRole: UserRole
  cost: number
  finishDate: Date
  todos: IToDo[] = []

  // Class internals
  ui: HTMLDivElement
  cost: number = 0
  progress: number = 0
  id: string

  static COLORS = ["#ca8134", "#4a90e2", "#8e44ad", "#16a085", "#f39c12", "#d35400"]

  constructor(data: IProject) {
    for (const key in data) {
      this[key] = data[key]
    }
    this.id = uuidv4()
    this.todos = data.todos ?? []
    this.setUI()
  }

  private initials(){
    if(!this.name) return "?"
    return this.name.slice(0,2).toUpperCase()
  }

  private randomColor(){
    const i = Math.floor(Math.random() * Project.COLORS.length)
    return Project.COLORS[i]
  }

  // creates the project card UI
  setUI() {
    if (this.ui) {return}
    this.ui = document.createElement("div")
    this.ui.className = "project-card"
    const color = this.randomColor()
    console.log("id: ",  this.id );
    this.ui.dataset.id = this.id
    this.ui.innerHTML = `
    <div class="card-header">
      <p class="project-icon" style="background-color: ${color}; padding: 10px; border-radius: 8px; aspect-ratio: 1;">${this.initials()}</p>
      <div>
        <h5>${this.name}</h5>
        <p>${this.description}</p>
      </div>
    </div>
    <div class="card-content">
      <div class="card-property">
        <p style="color: #969696;">Status</p>
        <p>${this.status}</p>
      </div>
      <div class="card-property">
        <p style="color: #969696;">Role</p>
        <p>${this.userRole}</p>
      </div>
      <div class="card-property">
        <p style="color: #969696;">Cost</p>
        <p>$${this.cost}</p>
      </div>
      <div class="card-property">
        <p style="color: #969696;">Estimated Progress</p>
        <p>${this.progress}%</p>
      </div>
    </div>`
  }
}