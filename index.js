const input = document.querySelector(".search");
const autocomplite = document.querySelector(".autocomplite");
const repoList = document.querySelector(".repo-list");
const spinner = document.querySelector(".spinner");

input.focus();

const debounce = (fn, debounceTime) => {
  let timerId;

  return function () {
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      fn.apply(this, arguments);
    }, debounceTime);
  };
};

// делаем поисковый запрос по строке, возвращаем ответ или выкидываем ошибку

async function searchRepo(query) {
  const searchURL = "https://api.github.com/search/repositories";

  const response = await fetch(`${searchURL}?q=${query}&sort=stars`, {
    headers: {
      "Content-Type": "application/vnd.github.v3+json",
    },
  });
  console.log(response);
  if (response.ok) return response.json();
  throw new Error("Ошибка загрузки");
}

// добавить контент в автокомплит и показать его

function showAutocomplite(string) {
  autocomplite.innerHTML = "";
  autocomplite.innerHTML = string;
  autocomplite.classList.remove("autocomplite--hidden");
}

// отчистить автокомплит

function clearAutocomplite() {
  autocomplite.classList.add("autocomplite--hidden");
  setTimeout(() => {
    autocomplite.innerHTML = "";
  }, 300);
  input.value = "";
  input.focus();
  spinner.style.display = "";
}

// получение элементов по поисковой строке и создание контента для автокомплита

async function renderAutocomplite(searchQuery) {
  if (searchQuery.length === 0) {
    clearAutocomplite();
    return;
  }

  let content = "";

  try {
    const { items } = await searchRepo(searchQuery);
    const count = items.length > 5 ? 5 : items.length;

    // если ничего не найдено, будем это выводить
    if (count === 0) {
      content += `
        <li class="error">По вашему запросу ничего не найдено :(</li>
        `;
      return;
    } else {
      // иначе собираем автокомплит
      for (let i = 0; i < count; i++) {
        content += `
          <li 
            class="autocomplite__item"
            data-name=${items[i].name}
            data-owner=${items[i].owner.login}
            data-stars=${items[i].stargazers_count}
            data-link=${items[i].html_url}
          >
            ${items[i].name}
          </li>
        `;
      }
    }
  } catch (error) {
    // если ошибка сервера
    content = `
    <li class="error">Ошибка загрузки, попробуйте позже... :(</li>
    `;
    console.warn(error);
  } finally {
    // убираем спинер, рисуем контент
    spinner.style.display = "";
    showAutocomplite(content);
  }
}

// пропускаем через дебаунс, чтобы ограничить запросы на сервер

renderAutocomplite = debounce(renderAutocomplite, 500);

// пока пользователь печатает и происходит запрос - показываем спинер

function inputHandler(e) {
  spinner.style.display = "flex";
  autocomplite.classList.add("autocomplite--hidden");
  renderAutocomplite(e.target.value);
}

input.addEventListener("input", inputHandler);

// следим за кликами по автокомплиту и создаём элементы в списке при клике

autocomplite.addEventListener("click", (e) => {
  if (e.target.classList.contains("autocomplite__item")) {
    const { name, owner, stars, link } = e.target.dataset;
    const repo = document.createElement("li");
    repo.classList.add("repo");
    repo.innerHTML = `
      <ul class="repo__info">
        <a href=${link} class="repo__link" target="_blank">
          <li class="repo__name">Name: ${name}</li>
          <li class="repo__owner">Owner: ${owner}</li>
          <li class="repo__stars">Stars: ${stars}</li>
        </a>
      </ul>
      <div class="close"></div>
    `;
    repoList.append(repo);
    clearAutocomplite();
  }
});

// удаляем записи по клику

repoList.addEventListener("click", (e) => {
  if (e.target.classList.contains("close")) {
    e.target.closest(".repo").classList.add("remove-animation");
    setTimeout(() => {
      e.target.closest(".repo").remove();
    }, 300);
  }
});
