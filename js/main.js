Vue.component('todo-item', {
    template: '\
<li>\
{{ title }}\
<button v-on:click="$emit(\'remove\')">Удалить</button>\
</li>\
',
    props: ['title']
});

Vue.component('columns', {
    template: `
        <div class="columns">
            <column title="Первый столбец" :cards="firstColumn" @add-card="addCard('firstColumn', $event)" @remove-card="removeCard('firstColumn', $event)" @save-local-storage="saveToLocalStorage"></column>
            <column title="Второй столбец" :cards="secondColumn" @add-card="addCard('secondColumn', $event)" @remove-card="removeCard('secondColumn', $event)" @save-local-storage="saveToLocalStorage"></column>
            <column title="Третий столбец" :cards="thirdColumn" @add-card="addCard('thirdColumn', $event)" @remove-card="removeCard('thirdColumn', $event)" @save-local-storage="saveToLocalStorage"></column>
        </div>
        `,
    data() {
        return {
            firstColumn: [],
            secondColumn: [],
            thirdColumn: []
        }
    },
    created() {
        this.loadFromLocalStorage();
    },
    methods: {
        addCard(column, customTitle) {
            if (column === 'firstColumn' && this.firstColumn.length >= 3) {
                alert('Достигнуто максимальное количество карточек в первом столбце.');
                return;
            }
            if (column === 'secondColumn' && this.secondColumn.length >= 5) {
                alert('Достигнуто максимальное количество карточек во втором столбце.');
                return;
            }
            const newCard = { title: customTitle || 'Новая заметка', items: [] };
            this[column].push(newCard);
            this.saveToLocalStorage(); // Сохраняем изменения при добавлении карточки
        },
        removeCard(column, cardIndex) {
            this[column].splice(cardIndex, 1);
            this.saveToLocalStorage();
        },
        saveToLocalStorage() {
            localStorage.setItem('todo-columns', JSON.stringify({
                firstColumn: this.firstColumn,
                secondColumn: this.secondColumn,
                thirdColumn: this.thirdColumn
            }));
        },
        loadFromLocalStorage() {
            const data = JSON.parse(localStorage.getItem('todo-columns'));
            if (data) {
                this.firstColumn = data.firstColumn || [];
                this.secondColumn = data.secondColumn || [];
                this.thirdColumn = data.thirdColumn || [];
            }
        }
    }
});

Vue.component('column', {
    props: ['title', 'cards'],
    template: `
        <div class="column">
            <h2>{{ title }}</h2>
            <card v-for="(card, index) in cards" :key="index" :card="card" @remove-card="removeCard(index)" @save-local-storage="saveToLocalStorage"></card>
            <button @click="addCardWithCustomTitle">Добавить заметку</button>
        </div>
        `,
    methods: {
        removeCard(cardIndex) {
            this.$emit('remove-card', cardIndex);
        },
        addCardWithCustomTitle() {
            const customTitle = prompt('Введите заголовок для новой заметки:');
            if (customTitle) {
                this.$emit('add-card', customTitle);
            }
        },
        saveToLocalStorage() {
            this.$emit('save-local-storage'); // Передаем событие сохранения изменений в родительский компонент
        }
    }
});

Vue.component('card', {
    props: ['card'],
    template: `
        <div class="card">
            <h3>{{ card.title }}</h3>
            <ul>
                <list-item v-for="(item, index) in card.items" :key="index" :item="item" @toggle-complete="toggleComplete(index)" @remove-item="removeItem(index)"></list-item>
            </ul>
            <button @click="addItem">Добавить пункт</button>
            <button @click="removeCard">Удалить заметку</button>
        </div>
        `,
    methods: {
        addItem() {
            const customText = prompt('Введите текст для нового пункта:');
            if (customText) {
                this.card.items.push({ text: customText, completed: false });
                this.$emit('save-local-storage');
            }
        },
        removeCard() {
            this.$emit('remove-card');
        },
        toggleComplete(index) {
            if (!this.card.items[index].completed) {
                this.card.items[index].completed = true;
            } else {
                this.card.items[index].completed = false;
            }
            this.$emit('save-local-storage');
        },
        removeItem(index) {
            this.card.items.splice(index, 1);
            this.$emit('save-local-storage');
        }
    }
});

Vue.component('list-item', {
    props: ['item'],
    template: `
        <li>
            <input type="checkbox" v-model="item.completed">
            <span :class="{ completed: item.completed }">{{ item.text }}</span>
            <button @click="$emit('remove-item')">Удалить</button>
        </li>
        `
});

new Vue({
    el: '#app',
    methods: {
        saveLocalStorage() {
            localStorage.setItem('todo-columns', JSON.stringify({
                firstColumn: this.firstColumn,
                secondColumn: this.secondColumn,
                thirdColumn: this.thirdColumn
            }));
        }
    },
    beforeUnmount() {
        this.saveLocalStorage();
    }
});
