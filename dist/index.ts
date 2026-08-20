import { IProject, ProjectStatus, UserRole } from "./classes/Project"
import { ProjectsManager } from "./classes/ProjectsManager"

function showModal(id: string) {
  const modal = document.getElementById(id)
  if (modal && modal instanceof HTMLDialogElement) {
    modal.showModal()
  } else {
    console.warn("The provided modal wasn't found. ID: ", id)
  }
}

function closeModal(id: string) {
  const modal = document.getElementById(id)
  if (modal && modal instanceof HTMLDialogElement) {
    modal.close()
  } else {
    console.warn("The provided modal wasn't found. ID: ", id)
  }
}

const projectsListUI = document.getElementById("projects-list") as HTMLElement
const projectsManager = new ProjectsManager(projectsListUI)

// This document object is provided by the browser, and its main purpose is to help us interact with the DOM.
const newProjectBtn = document.getElementById("new-project-btn")
if (newProjectBtn) {
  newProjectBtn.addEventListener("click", () => {showModal("new-project-modal")})
} else {
  console.warn("New projects button was not found")
}

const projectForm = document.getElementById("new-project-form")
if (projectForm && projectForm instanceof HTMLFormElement) {
  (projectForm.elements.namedItem("finishDate") as HTMLSelectElement).value = new Date().toISOString().slice(0, 10)

  projectForm.addEventListener("submit", (e) => {
    e.preventDefault()
    const formData = new FormData(projectForm)
    const name = (formData.get('name') as string || '').trim()
    if(name.length < 5){
      alert('Project name must be at least 5 characters')
      return
    }
    const finishRaw = (formData.get('finishDate') as string || '').trim()
    const finishDate = finishRaw ? new Date(finishRaw) : new Date().toISOString().slice(0, 10)
    const costValue = formData.get("cost") as string
    const projectData: IProject = {
      name,
      description: formData.get("description") as string,
      status: formData.get("status") as ProjectStatus,
      userRole: formData.get("userRole") as UserRole,
      cost: costValue ? Number(costValue) : 0,
      finishDate: finishDate as Date
    }
    const projectId = (formData.get('projectId') as string) || ''
    try {
      if(projectId){
        const existing = projectsManager.getProject(projectId)
        if(existing){
          existing.name = projectData.name
          existing.description = projectData.description
          existing.status = projectData.status
          existing.userRole = projectData.userRole
          existing.cost = projectData.cost
          existing.finishDate = projectData.finishDate
          // refresh UI: remove and recreate
          existing.ui.remove();
          (existing as any).ui = undefined
          existing.setUI()
          projectsListUI.append(existing.ui)
        }
      } else {
        const project = projectsManager.newProject(projectData)
        console.log(project)
      }
      projectForm.reset()
      closeModal("new-project-modal")
    } catch (err) {
      alert(err)
    }
  })
} else {
	console.warn("The project form was not found. Check the ID!")
}

const exportProjectsBtn = document.getElementById("export-projects-btn")
if (exportProjectsBtn) {
  exportProjectsBtn.addEventListener("click", () => {
    projectsManager.exportToJSON()
  })
}

const importProjectsBtn = document.getElementById("import-projects-btn")
if (importProjectsBtn) {
  importProjectsBtn.addEventListener("click", () => {
    projectsManager.importFromJSON()
  })
}

const newToDoBtn = document.getElementById("add-todo-btn")
if (newToDoBtn) {
  newToDoBtn.addEventListener("click", () => {showModal("todo-modal")})
} else {
  console.warn("New projects button was not found")
}


if(projectForm){
  let cancelBtn = projectForm.querySelector('button[name="cancel"]') as HTMLButtonElement
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {      
      projectForm.reset();
      closeModal("new-project-modal")
    })
  } else {
    console.warn("New projects button was not found")
  }
}

const navButtons = document.getElementById("nav-buttons");
console.log("nav-buttons", navButtons);
if(navButtons){
  let projectsLink = navButtons.querySelector('li[name="projects"]') as HTMLLIElement
  let usersLink = navButtons.querySelector('li[name="users"]') as HTMLLIElement
  if (projectsLink) {
    projectsLink.addEventListener("click", () => {      
        const projectsPage = document.getElementById("projects-page")
        const detailsPage = document.getElementById("project-details")
        if (!(projectsPage && detailsPage)) { return }
        projectsPage.style.display = "flex"
        detailsPage.style.display = "none"
        //this.setDetailsPage(project)
    })
  } else {
    console.warn("project nav link was not found")
  }

  if (usersLink) {
    usersLink.addEventListener("click", () => {      
      console.log("users nav link clicked");
    })
  } else {
    console.warn("users nav link was not found")
  }
}





