import { IProject, Project, ProjectStatus, UserRole } from "./Project"
import { v4 as uuidv4 } from 'uuid'

export class ProjectsManager {
  list: Project[] = []
  ui: HTMLElement

  constructor(container: HTMLElement) {
    this.ui = container
    this.newProject({
      name: "Default Project",
      description: "This is just a default app project",
      status: "pending",
      userRole: "architect",
      cost: 0,
      finishDate: new Date()
    })

    // Attach a single handler for the ToDo form (create/update)
    const todoForm = document.getElementById('todo-form') as HTMLFormElement
    const todoDialog = document.getElementById('todo-modal') as HTMLDialogElement
    if ( todoForm ) {
      todoForm.addEventListener('submit', (ev) => {
        ev.preventDefault()
        try {
          const fd = new FormData(todoForm)
          const todoId = (fd.get('todoId') as string) || ''
          const title = (fd.get('title') as string) || ''
          if (!title.trim()) {
            alert('ToDo title is required')
            return
          }
          const description = (fd.get('description') as string) || ''
          const dueDate = (fd.get('dueDate') as string) || ''
          const status = (fd.get('status') as string) as any
          const projectId = todoDialog?.dataset?.projectId || ''
          const project = this.list.find(p => p.id === projectId)
          if (!project) {
            alert('Project not found')
            return
          }
          if (todoId) {
            const todo = project.todos.find(t => t.id === todoId)
            if (todo) {
              todo.title = title
              todo.description = description
              todo.dueDate = dueDate
              todo.status = status
            }
          } else {
            project.todos = project.todos || []
            project.todos.push({ id: uuidv4(), title, description, dueDate, status })
          }
          if (todoDialog && typeof todoDialog.close === 'function') todoDialog.close();
          // re-render details
          this.setDetailsPage(project)
        } catch (err) {
          console.error('ToDo save error', err)
        }
      })
    }
  }

  newProject(data: IProject) {
    if (!data.name || data.name.trim().length < 5) {
      throw new Error('Project name must be at least 5 characters')
    }
    const projectNames = this.list.map((project) => project.name)
    const nameInUse = projectNames.includes(data.name)
    if (nameInUse) {
      throw new Error(`A project with the name "${data.name}" already exists`)
    }
    const project = new Project(data)
    this.addProjectCardClick(project)
    this.ui.append(project.ui)
    this.list.push(project)	
    return project
  }


  private setDetailsPage(project: Project) {

    const detailsPage = document.getElementById("project-details")
    if (!detailsPage) { return }

    const name = detailsPage.querySelector("[data-project-info='name']")
    if (name) { name.textContent = project.name }

    const description = detailsPage.querySelector("[data-project-info='description']")
    if (description) { description.textContent = project.description }

    const detailsIcon = document.getElementById('details-icon')
    if (detailsIcon) { detailsIcon.textContent = (project.name || '').slice(0,2).toUpperCase(); }

    const detailsName = detailsPage.querySelector("[data-project-info='details-name']")
    if (detailsName) { detailsName.textContent = project.name }

    const detailsDescription = detailsPage.querySelector("[data-project-info='details-description']")
    if (detailsDescription) { detailsDescription.textContent = project.description }

    const detailsStatus = detailsPage.querySelector("[data-project-info='details-status']")
    if (detailsStatus) { detailsStatus.textContent = project.status }

    const detailsCost = detailsPage.querySelector("[data-project-info='details-cost']")
    if (detailsCost) {  detailsCost.textContent = `$ ${project.cost.toString()}`}

    const detailsRole = detailsPage.querySelector("[data-project-info='details-role']")
    if (detailsRole) { detailsRole.textContent = project.userRole}

    const detailsFinishDate = detailsPage.querySelector("[data-project-info='details-finish-date']")
    if (detailsFinishDate) {
        detailsFinishDate.textContent = project.finishDate.toISOString().slice(0, 10)
    }


    const editBtn = document.getElementById('details-edit-btn');
    const editForm = document.getElementById("edit-project-form") as HTMLFormElement;
    if (editBtn) {

        editBtn.onclick = () => {
        
            if (!editForm) return
            (editForm.elements.namedItem("name") as HTMLTextAreaElement).value = project.name;
            (editForm.elements.namedItem("description") as HTMLTextAreaElement).value = project.description;
            (editForm.elements.namedItem("status") as HTMLSelectElement).value = project.status.toLowerCase();
            (editForm.elements.namedItem("userRole") as HTMLSelectElement).value = project.userRole.toLowerCase();
            (editForm.elements.namedItem("cost") as HTMLInputElement).value = project.cost.toString();
            (editForm.elements.namedItem("finishDate") as HTMLInputElement).value = project.finishDate.toISOString().slice(0, 10);

            let idInput = editForm.querySelector('input[name="projectId"]') as HTMLInputElement

            if (!idInput) {
                idInput = document.createElement("input")
                idInput.type = "hidden"
                idInput.name = "projectId"
                editForm.appendChild(idInput)
            }

            idInput.value = project.id

            const dialog = document.getElementById("edit-project-modal") as HTMLDialogElement
            if (dialog) dialog.showModal()
            editForm.addEventListener("submit", (e) => {
                e.preventDefault()
                    const formData = new FormData(editForm)
                    const name = (formData.get('name') as string || '').trim()
                    if(name.length < 5){
                    alert('Project name must be at least 5 characters')
                    return
                    }
                    const finishRaw = (formData.get('finishDate') as string || '').trim()
                    const finishDate = finishRaw ? new Date(finishRaw) : new Date()
                    const costValue = formData.get("cost") as string
                    const projectData: IProject = {
                        name,
                        description: formData.get("description") as string,
                        status: formData.get("status") as ProjectStatus,
                        userRole: formData.get("userRole") as UserRole,
                        cost: costValue ? Number(costValue) : 0,
                        finishDate: finishDate
                    }
                    const projectId = (formData.get('projectId') as string) || ''
                    try {
                        if(projectId){
                            const existing = this.getProject(projectId)
                            if(existing){
                                existing.name = projectData.name
                                existing.description = projectData.description
                                existing.status = projectData.status
                                existing.userRole = projectData.userRole
                                existing.cost = projectData.cost
                                existing.finishDate = projectData.finishDate;
                                existing.ui.remove();
                                (existing as any).ui = null
                                existing.setUI();
                                this.addProjectCardClick(existing)
                                this.ui.append(existing.ui)
                                this.setDetailsPage(existing)
                            }
                        }
                        dialog.close()
                    } catch (err) {
                        alert(err)
                    }
                }
            )
            if(editForm){
            let cancelBtn = editForm.querySelector('button[name="cancel"]') as HTMLButtonElement
            if (cancelBtn) {
                cancelBtn.addEventListener("click", () => {      
                    editForm.reset();
                    dialog.close()
                })
            } else {
                console.warn("New projects button was not found")
            }
            }

        }
    }

    const todosList = document.getElementById('todos-list')
    if (todosList) {
    todosList.innerHTML = ''
    for (const t of project.todos || []) {
        const div = document.createElement('div')
        div.className = 'todo-item'
        const statusClass = t.status === 'todo' ? 'todo-status-todo' : t.status === 'in-progress' ? 'todo-status-in-progress' : 'todo-status-done'
        div.classList.add(statusClass)
        div.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center;"><div style="display:flex; column-gap:15px; align-items:center;"><span class=\"material-icons-round\" style=\"padding:10px; background-color:#686868; border-radius:10px;\">construction</span><p>${t.title}</p></div><p style=\"text-wrap:nowrap; margin-left:10px;\">${t.dueDate || ''}</p></div>`
        div.onclick = () => {
        const todoDialog = document.getElementById('todo-modal') as HTMLDialogElement
        const todoForm = document.getElementById('todo-form') as HTMLFormElement
        if (!todoDialog || !todoForm) return
        // populate form with todo values for editing
        const todoIdInput = todoForm.elements.namedItem('todoId') as HTMLInputElement
        const titleInput = todoForm.elements.namedItem('title') as HTMLInputElement
        const descInput = todoForm.elements.namedItem('description') as HTMLTextAreaElement
        const dueInput = todoForm.elements.namedItem('dueDate') as HTMLInputElement
        const statusSelect = todoForm.elements.namedItem('status') as HTMLSelectElement
        if (todoIdInput) todoIdInput.value = t.id || ''
        if (titleInput) titleInput.value = t.title || ''
        if (descInput) descInput.value = t.description || ''
        if (dueInput) dueInput.value = t.dueDate || ''
        if (statusSelect) statusSelect.value = t.status || 'todo'
        todoDialog.dataset.projectId = project.id
        todoDialog.showModal()
        }
        todosList.appendChild(div)
    }
    const addBtn = document.getElementById('add-todo-btn')
    if (addBtn) {
        addBtn.onclick = () => {
        const todoDialog = document.getElementById('todo-modal') as HTMLDialogElement
        const todoForm = document.getElementById('todo-form') as HTMLFormElement
        if (!todoDialog || !todoForm) return
        // clear form for new todo
        const todoIdInput2 = todoForm.elements.namedItem('todoId') as HTMLInputElement
        const titleInput2 = todoForm.elements.namedItem('title') as HTMLInputElement
        const descInput2 = todoForm.elements.namedItem('description') as HTMLTextAreaElement
        const dueInput2 = todoForm.elements.namedItem('dueDate') as HTMLInputElement
        const statusSelect2 = todoForm.elements.namedItem('status') as HTMLSelectElement
        if (todoIdInput2) todoIdInput2.value = ''
        if (titleInput2) titleInput2.value = ''
        if (descInput2) descInput2.value = ''
        if (dueInput2) dueInput2.value = ''
        if (statusSelect2) statusSelect2.value = 'todo'
        todoDialog.dataset.projectId = project.id
        todoDialog.showModal()
        }
    }
    }
  }

  private addProjectCardClick(project: Project) {
    project.ui.addEventListener("click", () => {
      const projectsPage = document.getElementById("projects-page")
      const detailsPage = document.getElementById("project-details")

      if (!(projectsPage && detailsPage)) return

      projectsPage.style.display = "none"
      detailsPage.style.display = "flex"

      this.setDetailsPage(project)
    })
  }


  getProject(id: string) {
    const project = this.list.find((project) => {
      return project.id === id
    })
    return project
  }
  
  deleteProject(id: string) {
    const project = this.getProject(id)
    if (!project) { return }
    project.ui.remove()
    const remaining = this.list.filter((project) => {
      return project.id !== id
    })
    this.list = remaining
  }
  
  exportToJSON(fileName: string = "projects") {
    const plain = this.list.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      userRole: p.userRole,
      cost: p.cost,
      finishDate: p.finishDate,
      todos: p.todos ?? []
    }))
    const json = JSON.stringify(plain, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }
  
  importFromJSON() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    const reader = new FileReader()
    reader.addEventListener("load", () => {
      const json = reader.result
      if (!json) { return }
      const projects: IProject[] = JSON.parse(json as string)
      for (const project of projects) {
        // normalize finishDate to Date if it's a string
        const normalized: any = { ...project }
        if (typeof project.finishDate === 'string') {
          normalized.finishDate = new Date(project.finishDate)
        }
        const existing = this.list.find(p => p.name === project.name)
        if (existing) {
          // update existing
          existing.name = normalized.name
          existing.description = normalized.description
          existing.status = normalized.status
          existing.userRole = normalized.userRole
          existing.cost = normalized.cost
          existing.finishDate = normalized.finishDate
          existing.todos = normalized.todos ?? []
          // refresh UI
          existing.ui.remove()
          ;(existing as any).ui = undefined
          existing.setUI()
          this.addProjectCardClick(existing)
          this.ui.append(existing.ui)
          
        } else {
          try {
            this.newProject(normalized)
          } catch (error) {
            // ignore invalid entries
          }
        }
      }
    })
    input.addEventListener('change', () => {
      const filesList = input.files
      if (!filesList) { return }
      reader.readAsText(filesList[0])
    })
    input.click()
  }
}

